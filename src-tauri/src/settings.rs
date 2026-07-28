use std::fs;
use std::path::{Path, PathBuf};

use chrono::Datelike;
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager};

const SETTINGS_FILE_NAME: &str = "settings.json";

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppSettings {
    #[serde(default)]
    pub selected_invoice_directory: Option<String>,
    #[serde(default = "default_year")]
    pub year: i32,
    #[serde(default)]
    pub last_successful_sequence: u32,
}

fn default_year() -> i32 {
    chrono::Local::now().year()
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            selected_invoice_directory: None,
            year: default_year(),
            last_successful_sequence: 0,
        }
    }
}

fn settings_file_path(app: &AppHandle) -> Result<PathBuf, String> {
    app.path()
        .resolve(SETTINGS_FILE_NAME, tauri::path::BaseDirectory::AppConfig)
        .map_err(|error| error.to_string())
}

pub fn load_settings(app: &AppHandle) -> Result<AppSettings, String> {
    let path = settings_file_path(app)?;

    if !path.exists() {
        return Ok(AppSettings::default());
    }

    let contents = fs::read_to_string(&path).map_err(|error| error.to_string())?;

    match serde_json::from_str(&contents) {
        Ok(settings) => Ok(settings),
        Err(_) => Ok(AppSettings::default()),
    }
}

pub fn atomic_write_json<T: Serialize>(path: &Path, value: &T) -> Result<(), String> {
    let temp_path = path.with_extension("tmp");

    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|error| error.to_string())?;
    }

    let contents = serde_json::to_string_pretty(value).map_err(|error| error.to_string())?;
    fs::write(&temp_path, contents).map_err(|error| error.to_string())?;
    fs::rename(&temp_path, path).map_err(|error| error.to_string())?;

    Ok(())
}

pub fn save_settings(app: &AppHandle, settings: &AppSettings) -> Result<(), String> {
    let path = settings_file_path(app)?;
    atomic_write_json(&path, settings)
}
