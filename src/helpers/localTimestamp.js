const getLocalTimestamp = (format = 'iso') => {
  const now = new Date();
  const bangladeshTime = new Date(now.toLocaleString('en-US', { 
    timeZone: 'Asia/Dhaka' 
  }));
  
  const year = bangladeshTime.getFullYear();
  const month = (bangladeshTime.getMonth() + 1).toString().padStart(2, '0');
  const day = bangladeshTime.getDate().toString().padStart(2, '0');
  const hours = bangladeshTime.getHours().toString().padStart(2, '0');
  const minutes = bangladeshTime.getMinutes().toString().padStart(2, '0');
  const seconds = bangladeshTime.getSeconds().toString().padStart(2, '0');
  
  switch (format) {
    case 'bd':
      // Bangladesh format: "2024-01-15 16:30:45" (YYYY-MM-DD)
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    
    case 'bd-ddmmyyyy':
      // DD-MM-YYYY format: "15-01-2024 16:30:45"
      return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
    
    case 'readable':
      // Human readable: "15 Jan 2024 16:30:45"
      return bangladeshTime.toLocaleString('en-BD', {
        timeZone: 'Asia/Dhaka',
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
    
    case 'iso':
    default:
      // ISO with timezone: "2024-01-15T16:30:45+06:00"
      const offset = -now.getTimezoneOffset();
      const offsetHours = Math.floor(offset / 60).toString().padStart(2, '0');
      const offsetMinutes = (offset % 60).toString().padStart(2, '0');
      const offsetSign = offset >= 0 ? '+' : '-';
      
      return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${offsetSign}${offsetHours}:${offsetMinutes}`;
  }
};

module.exports = getLocalTimestamp;