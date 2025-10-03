const fs = require('fs');
const path = require('path');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
    console.log('✅ Logs directory created successfully');
}

// Create empty log files if they don't exist
const logFiles = ['error.log', 'combined.log'];
logFiles.forEach(file => {
    const filePath = path.join(logsDir, file);
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, '');
        console.log(`✅ Created ${file}`);
    }
});

console.log('✨ Initialization completed successfully');