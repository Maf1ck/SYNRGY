#include <ESP8266WiFi.h>
#include <espnow.h>
#include <Wire.h>
#include <ESP8266WebServer.h>

ESP8266WebServer server(80);

// --------- Налаштування користувача ----------
const char* AP_SSID = "SYNRGY-patient1";
const char* AP_PASS = "synrgy123";

// --------- Структура пакета від Slave ----------
typedef struct __attribute__((packed)) {
  float angleInjured;
  uint32_t timestamp;
} SynrgyPacket;

SynrgyPacket rxData;
bool injuredDataValid = false;

// --------- Глобальні змінні ----------
float angleHealthy      = 0;
float angleHealthyRaw   = 0;
float angleHealthyFilt  = 0;
float angleInjured      = 0;
int   heartRate         = 0;
uint32_t reps           = 0;
String statusMsg        = "Init";

const int FLEX_HEALTHY_PIN = A0;  // flex на Master
const int PULSE_PIN        = A0;  // зараз фейк, той самий пін

float alphaHealthy   = 0.2;
float maxSlewHealthy = 5.0;

bool  aboveThresholdPrev = false;
float repThresholdDeg    = 60.0;

// --------- ESP-NOW callback ----------
void onDataRecv(uint8_t * mac_addr, uint8_t *data, uint8_t len) {
  Serial.printf("ESP-NOW recv %d bytes from %02X:%02X:%02X:%02X:%02X:%02X\n",
                len, mac_addr[0],mac_addr[1],mac_addr[2],
                mac_addr[3],mac_addr[4],mac_addr[5]);
  if (len == sizeof(SynrgyPacket)) {
    memcpy(&rxData, data, len);
    angleInjured      = rxData.angleInjured;
    injuredDataValid  = true;
  }
}

// --------- Ініціалізація сенсорів ----------
void initSensors() {
  Wire.begin();
  pinMode(FLEX_HEALTHY_PIN, INPUT);
  pinMode(PULSE_PIN,        INPUT);
}

// --------- Зчитування та фільтрація кута здорової руки ----------
float readHealthyAngle() {
  int flexRaw = analogRead(FLEX_HEALTHY_PIN);
  float angle = map(flexRaw, 200, 800, 0, 120);  // під себе
  return constrain(angle, 0, 120);
}

float filterHealthyAngle(float in) {
  float iir   = alphaHealthy * in + (1.0f - alphaHealthy) * angleHealthyFilt;
  float delta = iir - angleHealthyFilt;
  if (delta >  maxSlewHealthy) delta =  maxSlewHealthy;
  if (delta < -maxSlewHealthy) delta = -maxSlewHealthy;
  angleHealthyFilt += delta;
  return angleHealthyFilt;
}

// --------- Пульс (заглушка, щоб усе працювало) ----------
int readHeartRate() {
  static unsigned long lastHR = 0;
  if (millis() - lastHR > 1000) {      // раз на секунду
    lastHR   = millis();
    heartRate = random(75, 95);       // фейковий пульс
  }
  return heartRate;
}

// --------- Підрахунок повторів ----------
void updateReps() {
  bool aboveNow = (angleInjured > repThresholdDeg) &&
                  (angleHealthyFilt > repThresholdDeg);
  if (aboveNow && !aboveThresholdPrev) {
    reps++;
  }
  aboveThresholdPrev = aboveNow;
}

// --------- Оновлення статусу ----------
void updateStatus() {
  if (!injuredDataValid) {
    statusMsg = "Очікування травмованої руки…";
    return;
  }
  float diff = fabs(angleHealthyFilt - angleInjured);
  statusMsg  = "Різниця: " + String(diff, 1) + "°";
  if (diff < 10.0) statusMsg += " | Симетрія OK";
  if (heartRate > 120) statusMsg += " | Високий пульс!";
}

// --------- Простий веб‑дашборд ----------
void handleRoot() {
  String page;
  page  = "<!DOCTYPE html><html><head><meta name='viewport' ";
  page += "content='width=device-width,initial-scale=1'>";
  page += "<title>SYNRGY</title>";
  page += "<style>";
  page += "body{background:#000;color:#0f0;font-family:Arial;";
  page += "text-align:center;padding:10px;}";
  page += ".card{background:#111;border-radius:10px;padding:10px;";
  page += "margin:10px;}";
  page += "</style></head><body>";
  page += "<h1>SYNRGY Rehab</h1>";

  page += "<div class='card'><b>Кут здорова:</b> "   + String(angleHealthyFilt,1) + "°<br>";
  page += "<b>Кут травмована:</b> " + String(angleInjured,1) + "°</div>";

  page += "<div class='card'><b>Пульс:</b> " + String(heartRate) +
          " уд/хв<br><b>Повтори:</b> " + String(reps) + "</div>";

  page += "<div class='card'>" + statusMsg + "</div>";

  page += "<p style='font-size:12px;color:#888;'>Підключись до WiFi "
          + String(AP_SSID) + " / " + String(AP_PASS) +
          " і онови сторінку.</p>";

  page += "</body></html>";

  server.send(200, "text/html", page);
}

// --------- JSON API для майбутнього 3D/графіків ----------
void handleJSON() {
  String json = "{";
  json += "\"healthy\":" + String(angleHealthyFilt,1) + ",";
  json += "\"injured\":" + String(angleInjured,1) + ",";
  json += "\"hr\":"      + String(heartRate) + ",";
  json += "\"reps\":"    + String(reps) + ",";
  json += "\"status\":\""+ statusMsg + "\"}";
  server.send(200, "application/json", json);
}

// --------- Ініціалізація ESP-NOW ----------
void setupESPNow() {
  if (esp_now_init() != 0) {
    Serial.println("ESP-NOW init FAILED");
    return;
  }
  esp_now_set_self_role(ESP_NOW_ROLE_COMBO);
  esp_now_register_recv_cb(onDataRecv);
  Serial.println("ESP-NOW OK");
}

// --------- SETUP ----------
void setup() {
  Serial.begin(115200);
  delay(200);

  // WiFi AP
  WiFi.mode(WIFI_AP_STA);
  WiFi.softAP(AP_SSID, AP_PASS);
  Serial.print("AP SSID: "); Serial.println(AP_SSID);
  Serial.print("AP IP:   "); Serial.println(WiFi.softAPIP());

  // Web
  server.on("/",      handleRoot);
  server.on("/json",  handleJSON);
  server.begin();
  Serial.println("Web server OK");

  // ESP‑NOW
  setupESPNow();

  // Сенсори
  initSensors();

  Serial.println("SYNRGY Master готовий!");
}

// --------- LOOP ----------
void loop() {
  server.handleClient();

  // Сенсори + логіка
  angleHealthyRaw = readHealthyAngle();
  angleHealthy    = filterHealthyAngle(angleHealthyRaw);
  heartRate       = readHeartRate();
  updateReps();
  updateStatus();

  // Debug у Serial
  static unsigned long lastPrint = 0;
  if (millis() - lastPrint > 500) {
    lastPrint = millis();
    Serial.printf("H=%.1f I=%.1f HR=%d Reps=%lu %s\n",
                  angleHealthy, angleInjured, heartRate, reps,
                  statusMsg.c_str());
  }

  delay(30);
}
