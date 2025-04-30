// From examples
// https://github.com/espressif/arduino-esp32/blob/master/libraries/BLE/examples/Notify/Notify.ino
// https://theorycircuit.com/esp32-projects/control-esp32-gpio-pins-using-web-bluetooth/
// https://wiki.seeedstudio.com/xiao_esp32c6_bluetooth/

#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>

// BLE UUIDs
#define SERVICE_UUID        "a88412db-f938-4ca0-8a33-955a60f4d04d"
#define LED_CHAR_UUID       "854f59dc-17c8-4cc2-8d14-006cd02cf066"
#define BUT_CHAR_UUID       "d2c1f2b9-9d00-478f-8241-a3a071be351c"

// GPIO Pins
#define LED_PIN D2
#define BUT_PIN D3

BLEServer *pServer = NULL;
BLECharacteristic *pLedCharacteristic = NULL;
BLECharacteristic *pButCharacteristic = NULL;

// state
bool deviceConnected = false;
bool oldDeviceConnected = false;
int prevButValue = 0;
uint32_t butPressed = 0;

void setLed(bool value) {
  if (value) digitalWrite(LED_PIN, HIGH);
  else digitalWrite(LED_PIN, LOW);
}

class MyServerCallbacks: public BLEServerCallbacks {
  void onConnect(BLEServer* pServer) {
    deviceConnected = true;
    Serial.println("Device connected");

    if (!oldDeviceConnected) {
      // do stuff here on connecting
      oldDeviceConnected = deviceConnected;
    }
  }

  void onDisconnect(BLEServer* pServer) {
    deviceConnected = false;
    Serial.println("Device disconnected");

    if (oldDeviceConnected) {
      setLed(false);
      delay(500);                   // give the bluetooth stack the chance to get things ready
      pServer->startAdvertising();  // restart advertising
      Serial.println("start advertising");
      oldDeviceConnected = deviceConnected;
    }
  }
};

class LedCallbacks: public BLECharacteristicCallbacks {
  void onWrite(BLECharacteristic *pCharacteristic) {
    String value = pCharacteristic->getValue();
    if (value.length() == 0) return;

    Serial.print("LED command: ");
    Serial.println(value.c_str());
    setLed(value == "1");
  }
};

void setup() {
  Serial.begin(115200);

  // Initialize GPIO
  pinMode(LED_BUILTIN, OUTPUT);
  pinMode(LED_PIN, OUTPUT);
  pinMode(BUT_PIN, INPUT_PULLDOWN);
  setLed(false); // LED off by default

  // Create the BLE Device
  BLEDevice::init("Lonis_Knopf_3000");

  // Create the BLE Server
  pServer = BLEDevice::createServer();
  pServer->setCallbacks(new MyServerCallbacks());

  // Create BLE Service
  BLEService *pService = pServer->createService(SERVICE_UUID);

  // Create LED Characteristic (writeable)
  pLedCharacteristic = pService->createCharacteristic(
    LED_CHAR_UUID,
    BLECharacteristic::PROPERTY_WRITE
  );
  pLedCharacteristic->setCallbacks(new LedCallbacks());

  // Create Button Characteristic (readable, notifying)
  pButCharacteristic = pService->createCharacteristic(
    BUT_CHAR_UUID,
    BLECharacteristic::PROPERTY_READ | BLECharacteristic::PROPERTY_NOTIFY
  );
  pButCharacteristic->addDescriptor(new BLE2902());

  // Start service
  pService->start();

  // Start advertising
  BLEAdvertising *pAdvertising = pServer->getAdvertising();
  pAdvertising->addServiceUUID(SERVICE_UUID);
  pAdvertising->setScanResponse(false);
  pAdvertising->setMinPreferred(0x00);  // set value to 0x00 to not advertise this parameter
  pServer->startAdvertising();
  Serial.println("BLE server started. Waiting for connection...");
}

uint8_t cycle = 0;

// for button debouncing
unsigned long lastButPress = 0;
// uint8_t continuousPress = 0;

void loop() {
  // Read Button value
  bool butValue = digitalRead(BUT_PIN);
  if (prevButValue != butValue) {
    prevButValue = butValue;

    if (butValue == HIGH) {
      Serial.println("raw press");
      unsigned long now = millis();
      if (lastButPress + 1000 < now /* && continuousPress >= 3 */) {
        // continuousPress = 0;
        Serial.println("Button pressed");
        if (deviceConnected) {
          // Update characteristic and notify
          pButCharacteristic->setValue((uint8_t *)&butPressed, 4);
          pButCharacteristic->notify();
          butPressed++;
        }
      }
      lastButPress = now;
      // continuousPress++;
    }
  }

  // every 8 cycles = 400ms flash led
  if (cycle % 8 == 0) {
    if (deviceConnected) {
      // light led while connected
      digitalWrite(LED_BUILTIN, LOW);
    } else {
      // flash led while advertising
      digitalWrite(LED_BUILTIN, cycle % 16 == 0 ? LOW : HIGH);
    }
  }

  cycle++;

  delay(50); // Update every 50ms
}
