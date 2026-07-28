use std::fs::OpenOptions;
use std::io::Write;
use std::path::Path;

const WRITE_TEST_FILE_NAME: &str = ".meer-ilyas-write-test";

pub fn is_directory_available(path: &str) -> bool {
    let path = Path::new(path.trim());

    if !path.exists() || !path.is_dir() {
        return false;
    }

    is_directory_writable(path)
}

fn is_directory_writable(path: &Path) -> bool {
    let test_path = path.join(WRITE_TEST_FILE_NAME);

    match OpenOptions::new()
        .write(true)
        .create_new(true)
        .open(&test_path)
    {
        Ok(mut file) => {
            let write_ok = file.write_all(b"ok").is_ok();
            let _ = std::fs::remove_file(test_path);
            write_ok
        }
        Err(_) => false,
    }
}
