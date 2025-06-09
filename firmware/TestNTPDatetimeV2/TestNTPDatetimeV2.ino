#define ENABLE_MODULE_DATETIME_NTP_V2

#include "Kinematrix.h"
#include "WiFi.h"

// WiFi credentials
const char* ssid = "silenceAndSleep";
const char* password = "11111111";

// NTP settings
const char* ntpServer = "pool.ntp.org";
const long gmtOffset_sec = 25200;  // GMT+7 (7*3600)
const int daylightOffset_sec = 0;  // No DST in Indonesia

// DateTimeNTP object
DateTimeNTPV2 dateTime(ntpServer, gmtOffset_sec, daylightOffset_sec);

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n\nDate Time NTP V2 Test");

  // Connect to WiFi
  Serial.printf("Connecting to %s ", ssid);
  WiFi.begin(ssid, password);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("\nFailed to connect to WiFi!");
    return;
  }

  Serial.println("\nWiFi connected");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());

  // Initialize NTP
  Serial.println("Initializing NTP client...");
  if (dateTime.begin()) {
    Serial.println("NTP client initialized successfully");
    printCurrentTime();
  } else {
    Serial.println("Failed to initialize NTP client");

    // Debug: try a direct configTime approach
    Serial.println("Trying direct configTime...");
    configTime(gmtOffset_sec, daylightOffset_sec, ntpServer);

    // Check if we can get the time
    struct tm timeinfo;
    if (getLocalTime(&timeinfo)) {
      Serial.println("Direct configTime successful");
      Serial.println(&timeinfo, "%A, %B %d %Y %H:%M:%S");
    } else {
      Serial.println("Direct configTime failed too");
    }
  }
}

void loop() {
  // Update time and print every 5 seconds
  static unsigned long lastUpdate = 0;
  if (millis() - lastUpdate > 5000) {
    if (dateTime.update()) {
      printCurrentTime();
    } else {
      Serial.println("Failed to update time");
    }
    lastUpdate = millis();
  }
}

void printCurrentTime() {
  Serial.println("Current time: " + dateTime.getDateTimeString());
  Serial.println("Unix time: " + String(dateTime.getUnixTime()));
  Serial.println("ISO8601: " + dateTime.getISO8601Time());
  Serial.println("Day of week: " + dateTime.getDayOfWeek());
  Serial.println("Is valid: " + String(dateTime.isValid() ? "Yes" : "No"));
  Serial.println("Is initialized: " + String(dateTime.isTimeInitialized() ? "Yes" : "No"));
  Serial.println();
}