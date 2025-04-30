import { createEventHook, createGlobalState } from "@vueuse/core";
import { onUnmounted, ref } from "vue";

export interface useBluetoothButtonOptions {
  onPressed: () => void;
}

const SERVICE_UUID = "a88412db-f938-4ca0-8a33-955a60f4d04d";
const LED_CHAR_UUID = "854f59dc-17c8-4cc2-8d14-006cd02cf066";
const BUT_CHAR_UUID = "d2c1f2b9-9d00-478f-8241-a3a071be351c";

// TODO: Add autoreconnect to gatt server feature

export default createGlobalState(() => {
  const bleConnectionStatus = ref<"disconnected" | "connected" | "connecting">("disconnected");
  const bleConnectionError = ref<string | null>(null);
  const bleLedStatus = ref<boolean>(false);
  const pressedEventHook = createEventHook<never>();

  let bleDevice: BluetoothDevice | null = null;
  let ledCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;
  let butCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;

  const handleButNotifications = (event: Event): void => {
    console.log("Button pressed");
    pressedEventHook.trigger();
  };

  const connectToBle = async () => {
    if (bleConnectionStatus.value === "connecting" || bleConnectionStatus.value === "connected") {
      return; // already connecting or connected
    }

    try {
      bleConnectionStatus.value = "connecting";

      // Request Bluetooth device
      bleDevice = await navigator.bluetooth.requestDevice({
        filters: [{ name: "Lonis_Knopf_3000" }],
        optionalServices: [SERVICE_UUID],
      });

      if (!bleDevice.gatt) {
        throw new Error("No GATT server found");
      }

      bleDevice.addEventListener("gattserverdisconnected", () => {
        console.log("Device disconnected");
        cleanupBle();
      });
      // Connect to GATT server
      await bleDevice.gatt.connect();
      const service = await bleDevice.gatt.getPrimaryService(SERVICE_UUID);

      ledCharacteristic = await service.getCharacteristic(LED_CHAR_UUID);
      butCharacteristic = await service.getCharacteristic(BUT_CHAR_UUID);

      await butCharacteristic.startNotifications();
      butCharacteristic.addEventListener("characteristicvaluechanged", handleButNotifications);

      bleConnectionStatus.value = "connected";
      bleConnectionError.value = null;
    } catch (error) {
      console.error("Error:", error);
      alert("Connection failed: " + error);
      bleConnectionError.value = String(error);
      bleConnectionStatus.value = "disconnected";
    }
  };

  const setLedState = async (ledState: boolean) => {
    if (!ledCharacteristic) {
      throw new Error("Bluetooth device not connected");
    }

    const buffer = new TextEncoder().encode(ledState ? "1" : "0");
    await ledCharacteristic.writeValue(buffer);
  };

  const cleanupBle = async () => {
    if (bleDevice && bleDevice.gatt && !bleDevice.gatt.connected) {
      bleConnectionStatus.value = "disconnected";
      bleConnectionError.value = null;
      bleLedStatus.value = false;
      bleDevice = null;
      ledCharacteristic = null;
      butCharacteristic = null;
      console.log("Disconnected from ESP32");
    }
  };

  const disconnectBle = async () => {
    if (bleDevice && bleDevice.gatt && bleDevice.gatt.connected) {
      bleDevice.gatt.disconnect();
      cleanupBle();
    }
  };

  onUnmounted(() => {
    cleanupBle();
  });

  return {
    bleConnectionStatus,
    bleConnectionError,
    connectToBle,
    setLedState,
    disconnectBle,
    onButPressed: pressedEventHook.on,
  };
});
