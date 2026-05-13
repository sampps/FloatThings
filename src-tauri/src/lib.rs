use tauri::Manager;
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::menu::{MenuBuilder, MenuItemBuilder};

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
fn resize_window(window: tauri::Window, width: f64, height: f64) {
    use tauri::{Size, Position};
    let sf = window.scale_factor().unwrap_or(1.0);
    let pw = (width * sf) as i32;
    let ph = (height * sf) as i32;

    if let (Ok(pos), Ok(outer_size)) = (window.outer_position(), window.outer_size()) {
        let dx = (outer_size.width as i32 - pw) / 2;
        let dy = (outer_size.height as i32 - ph) / 2;
        let nx = pos.x + dx;
        let ny = pos.y + dy;

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
    } else {
        let _ = window.set_size(Size::Logical((width, height).into()));
    }
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
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { .. } = event {
                window.app_handle().exit(0);
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