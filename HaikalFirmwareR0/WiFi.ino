#define FIREBASE_DATABASE_URL "https://haikal-90821-default-rtdb.firebaseio.com/"
#define FIREBASE_PROJECT_ID "haikal-90821"
#define FIREBASE_API_KEY "AIzaSyAc_Cchm55L1UzZVG2FXc32t_DTfyJfGMY"
#define FIREBASE_USER_EMAIL "admin@gmail.com"
#define FIREBASE_USER_PASSWORD "admin123"
#define FIREBASE_CLIENT_EMAIL "firebase-adminsdk-fbsvc@haikal-90821.iam.gserviceaccount.com"
#define FIREBASE_MSG_DEVICE_TOKEN "cJnjCBzORlawc7T2WvCq2L:APA91bEyoA65YjDAEU6Y_Mj6DQzw5KH_Svfs7ZoLv3Vdl-ZurpiN8BGi1R3qaOh1Ux_wNHacMHSGOfHuxxKQraLcWC-RowpmEvPQboZasgsWJQ_MWdS285Q"
const char FIREBASE_PRIVATE_KEY[] PROGMEM = "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCb6szkzoeJNS3W\nYMcKnfXEU0Pz7NKprnlxVPaxarWKVkUqg443fQcqD2L3YAqhE7slTwj0ugeHNptN\nTFJbxzh9zmiTdGJ29HOMZO0tIz6YVqG8DU9TNTvexNDePcOFd5zBK5DUS42XuoYD\nG7IEKSOBbSA0JnRoyFqJz4fX8i4peptcwTBs6fSmjgHoqYtnmEWE59BRkw8DRAc3\niaoe8S3FEOnIiO16vdy+FHtyUf6yKZdnV3ZmNIgaef6UNK9ryJLYKvK34yagYL9l\nr5LERkCD0DtVLv3Jh7sDsO5gsuD36mA1cqIkwkC8t3XAnFdqzVO2UaLdn6iLI/jV\n6AUp9ZPxAgMBAAECggEACJKvBG+0tR8m75AvsY5A6rQXWuytIqZUyB3/WH8BD2Ox\n9uX35mYqBC6HZwmxW+z9T85aNDacXltqy6PELYa1PPmh92WhWmATkGcmQWKcOP0e\ndHwY3f7h1VxmDapAu3B5vodaNcoXtX2Mi9Q0hBUM/jtVV3i70t0dWVF/ayjGUAJ3\nWAyzVrH/KrzV/00HfxSo8+ge5cUoXwu60aL8PwhOB7gPfFlGCJQo8WktobILfIua\nqcyWTJVJPfaLU9U7S5F4ofNWjva6fsstK8KQ7NgDEeIT7J5ODXcCuVG9BfcPeqCx\nz9cdqkojg1kDpsadrb8z/GMkR7aFz5vHi3JWpUIaAQKBgQDOVM0o3vDCDAj88qh8\nkjgdFQCerBLTEivPvqDxh/pn0tIVcDZRSqYNNY/WTNhFgz3c2iYKJHqXSHek6gdA\ncFEAJrOCgjmPZKoqvW9QomlzX7DABJx3yfjE1ol3gSCDxxGXd9YLNDlltgZKkHl3\n/uTFrXOa/wCtay97Xg5ZeQa0QQKBgQDBczk7fmQyX7JT1+p7IRhnMrH2OkJPmyBl\naRSiI5+ivkWQXT3fy3vWGYGfb7zGLXVAVKA0uay9QvswnHZQRVT2Fiu09PVTERx+\nNmOo3Y9fI9QMeadlzAxokO91eTrPBbZDEpVFmmj4whlaFzeMmKNFtRmEPTEl9C/M\noOKmo+ozsQKBgBznmloYaUf14ah14g6ZeUzxrUWNO5HgIM0YmnlboEO9L/sa3jEj\nMQH2t/DAkSejzB3NXbjcBWR+HWy38E4hredEhK9KyP+CjagxI4/7QKSOCjfMLZNG\ncxg4KcfZChIL6DX87rphFY1fI6B8ftfFmIzs0J4tDQ4+TseMlJwKLVtBAoGAQ08n\nI8c3b7uSXc/ru0nppsah2y2sMuyj2gU087F3cvXHWJLI25x+iyE209XaFg5tFKQd\nVhsgun2azvAxzn5BMJrIPF9bGLsEcfnUtUXaA92Ag5K0pxvXWW7MktBKoQu4vh+y\nJpSyX5ORpKIdZuMZNEDuDvAHsNAE7asxEZBJBhECgYAEYVIgH+ah7GVmUEDN0jWf\n69KFgBdQ6VEY9hGFPwLDgWSHa5E8W4F8pHL+QoAYinOeNe5vJ7vu/nUufcenu4cR\n6btBfucR4tuKZBTosN07OB6BW3IbxwMgR+BeMy/cs553alMuAs36NZQgOqRxKrrC\n316HzyN8KYakPsjLslqNIg==\n-----END PRIVATE KEY-----\n";

void wifiTask() {
  task.setInitCoreID(1);
  task.createTask(10000, [](void* pvParameter) {
    // WiFi.begin("TIMEOSPACE", "1234Saja");
    WiFi.begin("silenceAndSleep", "11111111");
    while (WiFi.status() != WL_CONNECTED) {
      delay(500);
      Serial.print(".");
    }
    Serial.println("IP: " + WiFi.localIP().toString());
    client.setInsecure();

    if (!dateTimeNTP.begin()) {
      Serial.println("Gagal memulai NTP Client!");
    }

    FirebaseV3Application::getInstance()->setTime(dateTimeNTP.now());
    if (!FirebaseV3Application::getInstance()->begin(FIREBASE_CLIENT_EMAIL, FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY)) {
      Serial.println("Failed to initialize Firebase Application");
      while (1) { delay(1000); }
    }

    firebase = new FirebaseV3RTDB(FirebaseV3Application::getInstance());
    firestore = new FirebaseV3Firestore(FirebaseV3Application::getInstance());
    messaging = new FirebaseV3Messaging(FirebaseV3Application::getInstance());

    firebase->begin(FIREBASE_DATABASE_URL);
    firestore->begin(FIREBASE_PROJECT_ID);
    messaging->begin(FIREBASE_PROJECT_ID);

    Serial.println("Firebase Init Success");

    disableCore1WDT();
    ledYellow.toggleInit(100, 2);

    JsonDocument documentData;
    String documentDataStr;
    String resultStr;

    for (;;) {
      FirebaseV3Application::getInstance()->loop();
      if (firebase) firebase->loop();
      if (firestore) firestore->loop();
      if (messaging) messaging->loop();

      if (!firebase->ready() || !firestore->isReady()) ledYellow.toggleAsync(150);
      else ledYellow.on();

      static uint32_t dateTimeNTPTimer;
      if (millis() - dateTimeNTPTimer >= 1000 && dateTimeNTP.update()) {
        if (!isNTPClientInitialize) {
          isNTPClientInitialize = true;
        }
        // Serial.println(dateTimeNTP.getDateTimeString());
        dateTimeNTPTimer = millis();
      }

      static uint32_t firebaseRTDBTimer;
      if (millis() - firebaseRTDBTimer >= 2000 && firebase->ready()) {  // FIREBASE_RTDB_START
        // firebase->set("/test/float", random(100) + 3.14159, 2);
        firebaseRTDBTimer = millis();
      }  // FIREBASE_RTDB_END

      static uint32_t firebaseFirestoreTimer;
      if (millis() - firebaseFirestoreTimer >= 5000 && !uuidRFID.isEmpty()) {
        firebaseFirestoreTimer = millis();

        String userResultStr = firestore->getDocument("users", "", true);
        JsonDocument userDocument;
        deserializeJson(userDocument, userResultStr);

        for (JsonVariant fields : userDocument["documents"].as<JsonArray>()) {
          String rfid = fields["fields"]["rfid"]["stringValue"].as<String>();
          if (uuidRFID == rfid) {
            Serial.print("| uuidRFID: ");
            Serial.print(uuidRFID);
            Serial.println();
            break;
          }
        }
      }

      // if (!firestore->isReady()) {  // FIREBASE_FIRESTORE_START
      //   // ledYellow.toggleAsync(250, [](bool state) {
      //   //   Serial.println("Wait for Firestore Ready !!");
      //   // });
      // } else {
      //   switch (firebaseFirestoreState) {
      //     case FIRESTORE_CREATE:
      //       Serial.print("| FIRESTORE_CREATE: ");
      //       Serial.print(FIRESTORE_CREATE);
      //       Serial.println();

      //       documentData["fields"]["name"]["stringValue"] = "John Doe";
      //       documentData["fields"]["age"]["integerValue"] = 30;
      //       documentData["fields"]["active"]["booleanValue"] = true;
      //       serializeJson(documentData, documentDataStr);

      //       resultStr = firestore->createDocument("users/user1", documentDataStr, true);
      //       Serial.print("| resultStr");
      //       Serial.print(resultStr);
      //       Serial.println();

      //       firebaseFirestoreState = FIRESTORE_IDE;
      //       break;
      //     case FIRESTORE_READ:
      //       Serial.print("| FIRESTORE_READ: ");
      //       Serial.print(FIRESTORE_READ);
      //       Serial.println();

      //       resultStr = firestore->getDocument("users/user1", "", true);
      //       Serial.print("| resultStr");
      //       Serial.print(resultStr);
      //       Serial.println();

      //       firebaseFirestoreState = FIRESTORE_IDE;
      //       break;
      //     case FIRESTORE_UPDATE:
      //       Serial.print("| FIRESTORE_UPDATE: ");
      //       Serial.print(FIRESTORE_UPDATE);
      //       Serial.println();

      //       documentData["fields"]["name"]["stringValue"] = "John Doe " + String(random(0, 30));
      //       documentData["fields"]["age"]["integerValue"] = random(0, 30);
      //       serializeJson(documentData, documentDataStr);

      //       resultStr = firestore->updateDocument("users/user1", documentDataStr, "name,age", true);
      //       Serial.print("| resultStr");
      //       Serial.print(resultStr);
      //       Serial.println();

      //       firebaseFirestoreState = FIRESTORE_IDE;
      //       break;
      //     case FIRESTORE_DELETE:
      //       Serial.print("| FIRESTORE_DELETE: ");
      //       Serial.print(FIRESTORE_DELETE);
      //       Serial.println();

      //       resultStr = firestore->deleteDocument("users/user1", true);
      //       Serial.print("| resultStr");
      //       Serial.print(resultStr);
      //       Serial.println();

      //       firebaseFirestoreState = FIRESTORE_IDE;
      //       break;
      //   }
      // }  // FIREBASE_FIRESTORE_END

      // if (!messaging->isReady()) {  // FIREBASE_MESSAGING_START
      //   // ledYellow.toggleAsync(250, [](bool state) {
      //   //   Serial.println("Wait for Mesagging Ready !!");
      //   // });
      // } else {
      //   if (firebaseMessagingState == MESSAGING_SEND) {
      //     messaging->clearMessage();
      //     messaging->setToken(FIREBASE_MSG_DEVICE_TOKEN);
      //     messaging->setNotification("Pesan dari ESP32", "Hallo ESP32");
      //     messaging->setAndroidPriority(true);
      //     resultStr = messaging->sendMessage(true);
      //     Serial.println(resultStr);
      //     firebaseMessagingState = MESSAGING_IDLE;
      //   }
      // }  // FIREBASE_MESSAGING_END
    }
  });
}