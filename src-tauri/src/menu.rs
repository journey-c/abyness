use tauri::image::Image;
use tauri::menu::{
    IconMenuItemBuilder, MenuBuilder, MenuItemBuilder, PredefinedMenuItem, SubmenuBuilder,
};
use tauri::{App, AppHandle, Emitter};

use crate::recent;

/// 最近菜单用的内嵌图标(编译期打包)。
const ICON_MD: &[u8] = include_bytes!("../icons/menu/md.png");
const ICON_FOLDER: &[u8] = include_bytes!("../icons/menu/folder.png");

/// 初始化原生菜单(启动时调用一次)。
pub fn setup_menu(app: &App) -> tauri::Result<()> {
    let handle = app.handle().clone();
    build_and_set(&handle)?;

    // 自定义菜单项 → 转发为前端事件
    app.on_menu_event(move |app, event| {
        let id = event.id().0.as_str();
        if matches!(id, "new" | "open_folder" | "save" | "toggle_sidebar") {
            let _ = app.emit(&format!("menu:{id}"), ());
        } else if id == "recent_clear" {
            recent::clear(app);
            let _ = build_and_set(app); // 重建菜单以清空子项
        } else if let Some(path) = id.strip_prefix("recent::") {
            // 打开某条最近记录:把路径发给前端处理
            let _ = app.emit("menu:open_recent", path.to_string());
        }
    });

    Ok(())
}

/// 供命令层在“打开了新文件/文件夹”后调用,刷新“打开最近”子菜单。
pub fn rebuild(app: &AppHandle) -> tauri::Result<()> {
    build_and_set(app)
}

/// 构建整套菜单并设置到应用(可重复调用以刷新“打开最近”)。
fn build_and_set(handle: &AppHandle) -> tauri::Result<()> {
    // 应用菜单(macOS 左上角 App 名下拉)
    let app_menu = SubmenuBuilder::new(handle, "Abyness")
        .about(None)
        .separator()
        .services()
        .separator()
        .hide()
        .hide_others()
        .show_all()
        .separator()
        .quit()
        .build()?;

    // 文件菜单
    let new_item = MenuItemBuilder::new("新建文件")
        .id("new")
        .accelerator("CmdOrCtrl+N")
        .build(handle)?;
    let open_folder_item = MenuItemBuilder::new("打开文件夹…")
        .id("open_folder")
        .accelerator("CmdOrCtrl+Shift+O")
        .build(handle)?;
    let save_item = MenuItemBuilder::new("保存")
        .id("save")
        .accelerator("CmdOrCtrl+S")
        .build(handle)?;

    let file_menu = SubmenuBuilder::new(handle, "文件")
        .item(&new_item)
        .item(&open_folder_item)
        .item(&build_recent_submenu(handle)?)
        .separator()
        .item(&save_item)
        .separator()
        .item(&PredefinedMenuItem::close_window(handle, None)?)
        .build()?;

    // 编辑菜单:预定义项
    let edit_menu = SubmenuBuilder::new(handle, "编辑")
        .item(&PredefinedMenuItem::undo(handle, None)?)
        .item(&PredefinedMenuItem::redo(handle, None)?)
        .separator()
        .item(&PredefinedMenuItem::cut(handle, None)?)
        .item(&PredefinedMenuItem::copy(handle, None)?)
        .item(&PredefinedMenuItem::paste(handle, None)?)
        .item(&PredefinedMenuItem::select_all(handle, None)?)
        .build()?;

    // 视图菜单
    let toggle_sidebar = MenuItemBuilder::new("切换侧边栏")
        .id("toggle_sidebar")
        .accelerator("CmdOrCtrl+\\")
        .build(handle)?;
    let view_menu = SubmenuBuilder::new(handle, "视图")
        .item(&toggle_sidebar)
        .separator()
        .item(&PredefinedMenuItem::fullscreen(handle, None)?)
        .build()?;

    let menu = MenuBuilder::new(handle)
        .item(&app_menu)
        .item(&file_menu)
        .item(&edit_menu)
        .item(&view_menu)
        .build()?;

    handle.set_menu(menu)?;
    Ok(())
}

/// 构建“打开最近”子菜单:文件在前、文件夹在后,中间用分隔线隔开,末尾附“清除”项。
fn build_recent_submenu(handle: &AppHandle) -> tauri::Result<tauri::menu::Submenu<tauri::Wry>> {
    let recents = recent::load(handle);
    let mut builder = SubmenuBuilder::new(handle, "打开最近");

    if recents.is_empty() {
        // 无记录时给一个灰置项(禁用)
        let empty = MenuItemBuilder::new("(无最近记录)")
            .id("recent_empty")
            .enabled(false)
            .build(handle)?;
        builder = builder.item(&empty);
    } else {
        let folder_icon = Image::from_bytes(ICON_FOLDER).ok();
        let md_icon = Image::from_bytes(ICON_MD).ok();

        let dirs: Vec<_> = recents.iter().filter(|e| e.is_dir).collect();
        let files: Vec<_> = recents.iter().filter(|e| !e.is_dir).collect();

        // 文件分组(Markdown 徽标图标)放在上方
        for entry in &files {
            let name = recent::display_name(&entry.path);
            let mut b = IconMenuItemBuilder::new(name).id(format!("recent::{}", entry.path));
            if let Some(icon) = md_icon.clone() {
                b = b.icon(icon);
            }
            builder = builder.item(&b.build(handle)?);
        }
        // 文件与文件夹之间用分隔线隔开
        if !dirs.is_empty() && !files.is_empty() {
            builder = builder.separator();
        }
        // 文件夹分组(蓝色文件夹图标)放在下方
        for entry in &dirs {
            let name = recent::display_name(&entry.path);
            let mut b = IconMenuItemBuilder::new(name).id(format!("recent::{}", entry.path));
            if let Some(icon) = folder_icon.clone() {
                b = b.icon(icon);
            }
            builder = builder.item(&b.build(handle)?);
        }

        builder = builder.separator();
        let clear = MenuItemBuilder::new("清除最近记录")
            .id("recent_clear")
            .build(handle)?;
        builder = builder.item(&clear);
    }

    builder.build()
}
