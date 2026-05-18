use tauri::Manager;
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::menu::{MenuBuilder, MenuItemBuilder};
use std::sync::Mutex;

struct AppState {
    last_w: Mutex<f64>,
    last_h: Mutex<f64>,
}

impl Default for AppState {
    fn default() -> Self {
        Self {
            last_w: Mutex::new(52.0),
            last_h: Mutex::new(52.0),
        }
    }
}

#[tauri::command]
fn toggle_visible(window: tauri::Window) {
    if let Ok(visible) = window.is_visible() {
        if visible { let _ = window.hide(); }
        else { let _ = window.show(); let _ = window.set_focus(); }
    }
}

#[tauri::command]
fn start_dragging(window: tauri::Window) {
    #[cfg(target_os = "windows")]
    {
        extern "system" {
            fn ReleaseCapture() -> i32;
            fn SendMessageW(h: *mut std::ffi::c_void, m: u32, w: usize, l: isize) -> isize;
        }
        if let Ok(h) = window.hwnd() {
            unsafe {
                ReleaseCapture();
                SendMessageW(h.0, 0x00A1, 2, 0); // WM_NCLBUTTONDOWN, HTCAPTION
            }
        }
    }
}

#[tauri::command]
fn resize_window(window: tauri::Window, state: tauri::State<'_, AppState>, width: f64, height: f64, keep_top_left: Option<bool>) {
    {
        let mut lw = state.last_w.lock().unwrap();
        let mut lh = state.last_h.lock().unwrap();
        *lw = width;
        *lh = height;
    }

    apply_physical_size(&window, width, height, keep_top_left.unwrap_or(false));
}

fn apply_physical_size(window: &tauri::Window, width: f64, height: f64, keep_top_left: bool) {
    use tauri::{Size, Position};
    let sf = window.scale_factor().unwrap_or(1.0);
    let pw = (width * sf) as i32;
    let ph = (height * sf) as i32;

    let (mut nx, mut ny) = if keep_top_left {
        // Keep top-left corner fixed — for resize grip
        if let Ok(pos) = window.outer_position() {
            (pos.x, pos.y)
        } else {
            (0, 0)
        }
    } else {
        // Center the window — for bubble ↔ panel transitions
        if let (Ok(pos), Ok(outer_size)) = (window.outer_position(), window.outer_size()) {
            let dx = (outer_size.width as i32 - pw) / 2;
            let dy = (outer_size.height as i32 - ph) / 2;
            (pos.x + dx, pos.y + dy)
        } else {
            (0, 0)
        }
    };

    // Clamp to the monitor the window is actually on (multi-monitor safe)
    if let Ok(monitors) = window.available_monitors() {
        let (cx, cy) = (nx + pw / 2, ny + ph / 2);
        let mut best = None;
        for m in &monitors {
            let s = m.size();
            let (mx, my, mw, mh) = (m.position().x, m.position().y, s.width as i32, s.height as i32);
            if cx >= mx && cx < mx + mw && cy >= my && cy < my + mh {
                best = Some((mx, my, mw, mh));
                break;
            }
        }
        // Fallback to the monitor closest to the window center
        if best.is_none() && !monitors.is_empty() {
            let mut min_dist = i32::MAX;
            for m in &monitors {
                let s = m.size();
                let (mx, my, mw, mh) = (m.position().x, m.position().y, s.width as i32, s.height as i32);
                let dist = (cx - (mx + mw / 2)).abs() + (cy - (my + mh / 2)).abs();
                if dist < min_dist { min_dist = dist; best = Some((mx, my, mw, mh)); }
            }
        }
        if let Some((mx, my, mw, mh)) = best {
            let min_visible = 60;
            if nx < mx + min_visible - pw { nx = mx + min_visible - pw; }
            if nx > mx + mw - min_visible { nx = mx + mw - min_visible; }
            if ny < my { ny = my; }
            if ny > my + mh - min_visible { ny = my + mh - min_visible; }
        }
    }

    #[cfg(target_os = "windows")]
    {
        extern "system" { fn SetWindowPos(h: *mut std::ffi::c_void, _a: *mut std::ffi::c_void, x: i32, y: i32, cx: i32, cy: i32, f: u32) -> i32; }
        if let Ok(h) = window.hwnd() {
            const SWP_NOZORDER: u32 = 0x0004;
            const SWP_NOACTIVATE: u32 = 0x0010;
            unsafe { SetWindowPos(h.0, std::ptr::null_mut(), nx, ny, pw, ph, SWP_NOZORDER | SWP_NOACTIVATE); }
            return;
        }
    }

    let _ = window.set_size(Size::Logical((width, height).into()));
    let _ = window.set_position(Position::Physical((nx, ny).into()));
}

#[tauri::command]
fn get_cursor_pos() -> (i32, i32) {
    #[repr(C)]
    struct POINT { x: i32, y: i32 }

    #[link(name = "user32")]
    extern "system" {
        fn GetCursorPos(lpPoint: *mut POINT) -> i32;
    }

    unsafe {
        let mut pt = POINT { x: 0, y: 0 };
        GetCursorPos(&mut pt);
        (pt.x, pt.y)
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![toggle_visible, start_dragging, resize_window, get_cursor_pos])
        .manage(AppState::default())
        .on_window_event(|window, event| {
            match &event {
                tauri::WindowEvent::CloseRequested { api, .. } => {
                    api.prevent_close();
                    let _ = window.hide();
                }
                tauri::WindowEvent::ScaleFactorChanged { .. } => {
                    let state = window.app_handle().state::<AppState>();
                    let lw = *state.last_w.lock().unwrap();
                    let lh = *state.last_h.lock().unwrap();
                    apply_physical_size(&window, lw, lh, false);
                }
                _ => {}
            }
        })
        .setup(|app| {
            let icon_bytes = include_bytes!("../icons/32x32.png");
            let decoder = png::Decoder::new(std::io::Cursor::new(icon_bytes));
            let mut reader = decoder.read_info().expect("Failed to read PNG info");
            let mut buf = vec![0; reader.output_buffer_size()];
            let info = reader.next_frame(&mut buf).expect("Failed to decode PNG");
            let icon = tauri::image::Image::new_owned(buf, info.width, info.height);

            let quit_item = MenuItemBuilder::with_id("quit", "退出").build(app)?;
            let show_item = MenuItemBuilder::with_id("toggle", "显示/隐藏").build(app)?;
            let menu = MenuBuilder::new(app).item(&show_item).item(&quit_item).build()?;

            let _tray = TrayIconBuilder::new()
                .icon(icon)
                .menu(&menu)
                .tooltip("浮事")
                .on_menu_event(|app, event| {
                    match event.id().as_ref() {
                        "quit" => app.exit(0),
                        "toggle" => {
                            if let Some(window) = app.get_webview_window("main") {
                                if window.is_visible().unwrap_or(false) {
                                    let _ = window.hide();
                                } else {
                                    let _ = window.show();
                                    let _ = window.set_focus();
                                }
                            }
                        }
                        _ => {}
                    }
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up, ..
                    } = event {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                })
                .build(app)?;

            let window = app.get_webview_window("main").unwrap();
            let _ = window.show();
            let _ = window.set_focus();
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}