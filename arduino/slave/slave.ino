#include <ESP8266WiFi.h>
#include <espnow.h>
#include <Wire.h>

// ========== MAC-АДРЕСА MASTER ==========
uint8_t masterAddress[] = {0x24, 0x6F, 0x28, 0xAA, 0xBB, 0xCC}; // заміни

// ===== Структура даних =========
typedef struct __attribute__((packed)) {
  float angleInjured;
  uint32_t timestamp;
} SynrgyPacket;

SynrgyPacket txData;

// ===== Налаштування фільтру (IIR + slew rate) =====
float angleRaw = 0;
float angleFilt = 0;
float alpha = 0.2;          // коеф. IIR (налаштовуєш)
float maxSlewDegPerSample = 5.0; // макс. зміна кута за вибірку

unsigned long lastSendMs = 0;
const unsigned long sendIntervalMs = 50; // 20 Гц

// TODO: пін Flex-сенсора
const int FLEX_PIN = A0;

// ====== CALLBACK відправки ======
void onDataSent(uint8_t *mac_addr, uint8_t sendStatus) {
  // Можеш дебажити: 0 = OK
}

// ====== ІНІЦІАЛІЗАЦІЯ MPU6050 + Flex ======
void initSensors() {
  Wire.begin();

  // TODO: Встав свій код ініціалізації MPU6050 з Puls.ino/flex.ino
  // приклад:
  // mpu.initialize();
}

float readAngleFromMPUAndFlex() {
  // TODO: тут комбінуєш MPU6050 + Flex та повертаєш кут у градусах
  // Наприклад:
  // 1) читаєш flex -> сирий ADC
  // 2) переводиш у кут (калібрування)
  // 3) опціонально використовуєш MPU6050 для корекції
  return angleRaw;
}

float filterAngle(float input) {
  // IIR
  float iir = alpha * input + (1.0 - alpha) * angleFilt;

  // Slew-rate limiter
  float delta = iir - angleFilt;
  if (delta > maxSlewDegPerSample) delta = maxSlewDegPerSample;
  if (delta < -maxSlewDegPerSample) delta = -maxSlewDegPerSample;

  angleFilt += delta;
  return angleFilt;
}

void setup() {
  Serial.begin(115200);

  // WiFi в режим STA для ESP-NOW
  WiFi.mode(WIFI_STA);
  WiFi.disconnect();

  if (esp_now_init() != 0) {
    Serial.println("ESP-NOW init failed");
    return;
  }

  esp_now_set_self_role(ESP_NOW_ROLE_CONTROLLER);
  esp_now_register_send_cb(onDataSent);
  esp_now_add_peer(masterAddress, ESP_NOW_ROLE_SLAVE, 1, NULL, 0);

  initSensors();
}

void loop() {
  unsigned long now = millis();
  if (now - lastSendMs >= sendIntervalMs) {
    lastSendMs = now;

    angleRaw = readAngleFromMPUAndFlex();
    float angle = filterAngle(angleRaw);

    txData.angleInjured = angle;
    txData.timestamp = now;  // умовний час

    esp_now_send(masterAddress, (uint8_t*)&txData, sizeof(txData));
  }
}
