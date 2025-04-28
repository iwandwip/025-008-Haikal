#include <WiFi.h>
#include "time.h"

// WiFi credentials
const char* ssid = "silenceAndSleep";
const char* password = "11111111";

// NTP server settings
const char* ntpServer = "pool.ntp.org";
const long gmtOffset_sec = 25200;  // GMT+7 untuk Indonesia (dalam detik)
const int daylightOffset_sec = 0;  // Tidak ada daylight saving time di Indonesia

void setup() {
  Serial.begin(115200);

  // Matikan WiFi terlebih dahulu untuk memastikan status bersih
  WiFi.mode(WIFI_OFF);
  delay(1000);

  // Set mode WiFi ke STA mode (station mode)
  WiFi.mode(WIFI_STA);

  // Menghubungkan ke WiFi
  Serial.printf("Connecting to %s ", ssid);
  WiFi.begin(ssid, password);

  // Tunggu koneksi
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println(" CONNECTED");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());

  // Inisialisasi dan ambil waktu
  configTime(gmtOffset_sec, daylightOffset_sec, ntpServer);
  printLocalTime();

  // Matikan WiFi setelah selesai
  Serial.println("Mematikan WiFi untuk menghemat daya");
  WiFi.disconnect(true);
  WiFi.mode(WIFI_OFF);
}

void loop() {
  printLocalTime();
  delay(1000);
}

void printLocalTime() {
  struct tm timeinfo;
  if (!getLocalTime(&timeinfo)) {
    Serial.println("Failed to obtain time");
    return;
  }
  Serial.println(&timeinfo, "%A, %B %d %Y %H:%M:%S");
}