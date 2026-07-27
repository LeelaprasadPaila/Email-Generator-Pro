# Email Generator Pro

An enterprise-grade email generator tool that creates email addresses from name and mobile number inputs. Built with pure HTML, CSS, and JavaScript.

## Features

- **Single Email Generation** - Generate email addresses from name and mobile number
- **Bulk Generation** - Process multiple entries at once with progress tracking
- **History Management** - View, search, sort, and manage generated email history
- **Export Options** - Export data as TXT or CSV files
- **CSV Import** - Import data from CSV files for batch processing
- **Dark/Light Theme** - Toggle between dark and light mode
- **QR Code Generation** - Generate QR codes for email addresses
- **Undo Delete** - Undo accidental deletions with a 10-second undo window
- **Auto Backup** - Automatic backup after 100 generations

## How It Works

The email generation algorithm:
1. Takes the full name and removes spaces/special characters
2. Extracts the last 5 digits of the mobile number
3. Combines them with @gmail.com domain
4. Handles duplicates by appending incremental suffixes

## Project Structure

```
Email-Generator-Pro/
│
├── index.html              # Main HTML file
├── README.md               # This file
├── LICENSE                 # MIT License
├── .gitignore              # Git ignore rules
│
├── assets/
│   ├── images/
│   │   ├── screenshot.png  # App screenshot
│   │   ├── banner.png      # Banner image (optional)
│   │   └── logo.png        # Logo image (optional)
│   ├── css/
│   │   └── style.css       # Stylesheet
│   └── js/
│       └── script.js       # JavaScript logic
│
└── docs/                   # Documentation folder
```

## Usage

1. Open `index.html` in a modern web browser
2. Enter a name and 10-digit mobile number (starting with 6-9)
3. Click "Generate Email" or press Enter
4. The generated email is automatically copied to clipboard

### Bulk Generation

Paste data in CSV format:
```
Name,Mobile
John Doe,9876543210
Jane Smith,9876543211
```

### Keyboard Shortcuts

- `Enter` - Generate email
- `Ctrl+C` - Copy generated email
- `Ctrl+D` - Toggle dark/light theme
- `Ctrl+H` - Clear history
- `Escape` - Close modals
- `Alt+1` - Focus name input
- `Alt+2` - Focus mobile input

## Browser Support

Modern browsers with ES6+ support (Chrome, Firefox, Edge, Safari)

## License

MIT License - see [LICENSE](LICENSE) file for details.