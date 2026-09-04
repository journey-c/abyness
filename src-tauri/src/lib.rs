mod commands;
mod menu;
mod recent;
mod search;

/// Tauri 应用入口。注册插件与命令处理器。
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            menu::setup_menu(app)?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::read_file,
            commands::write_file,
            commands::rename_file,
            commands::list_dir,
            commands::file_mtime,
            commands::create_file,
            commands::create_dir,
            commands::delete_path,
            commands::reveal_in_explorer,
            commands::add_recent,
            commands::get_recents,
            search::search_files,
        ])
        .build(tauri::generate_context!())
        .expect("构建 Abyness 应用时出错")
        .run(|_app_handle, event| {
            // WebKit 在启动完成后才把 AutoFill 注入「编辑」菜单,
            // 故等到事件循环就绪再移除(仅 macOS)。
            #[cfg(target_os = "macos")]
            if let tauri::RunEvent::Ready = event {
                menu::remove_autofill_menu_item();
            }
            let _ = &event;
        });
}
