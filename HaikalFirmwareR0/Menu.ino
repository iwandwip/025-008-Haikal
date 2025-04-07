void lcdMenuCallback() {
  // "             "
  static auto menuUtama = menu.createMenu(2, "Bayar", "Daftar Akun");
  menu.onSelect(
    menuUtama, "Daftar Akun", []() {
      uuidRFID = "";
      menu.setState(menuUtama, "Daftar Akun", 0);
    },
    [](int state) {
      if (!buttonOkStr.isEmpty()) {
        uuidRFID = "";
        menu.clearMenu(menuUtama, menu.end());
      }
      if (state == 0) {
        auto menuDaftar0 = menu.createMenu(2, " Silakan Tap ", " Master RFID ");
        menu.showMenu(menuDaftar0, true);
        menu.freeMenu(menuDaftar0);
        if (!uuidRFID.isEmpty()) {
          menu.setState(menuUtama, "Daftar Akun", 1);
          checkRFIDState = 1;
          isRFIDValid = 0;
        }
      } else if (state == 1) {
        auto menuDaftar1 = menu.createMenu(2, " Pengecekan  ", "    RFID     ");
        menu.showMenu(menuDaftar1, true);
        menu.wait(2000);
        menu.freeMenu(menuDaftar1);
        while (checkRFIDState) {
          ledRed.toggleDelay(100);
        }
        ledRed.on();
        if (isRFIDValid) {
          auto menuDaftar2 = menu.createMenu(2, " RFID Master ", "  Terdaftar  ");
          menu.showMenu(menuDaftar2, true);
          menu.wait(2000);
          menu.freeMenu(menuDaftar2);
          menu.setState(menuUtama, "Daftar Akun", 2);
          uuidRFID = "";
        } else {
          auto menuDaftar3 = menu.createMenu(2, " RFID Master ", "Tdk Terdaftar");
          menu.showMenu(menuDaftar3, true);
          menu.wait(2000);
          menu.freeMenu(menuDaftar3);
          menu.clearMenu(menuUtama, menu.end());
        }
      } else if (state == 2) {
        auto menuDaftar4 = menu.createMenu(2, " Silakan Tap ", "  RFID Anda  ");
        menu.showMenu(menuDaftar4, true);
        menu.freeMenu(menuDaftar4);
        if (!uuidRFID.isEmpty()) {
          while (registerRFIDState) {
            ledRed.toggleDelay(100);
          }
          if (isRegisterRFIDValid) {
            auto menuDaftar5 = menu.createMenu(2, "  Register   ", "  Berhasil   ");
            menu.showMenu(menuDaftar5, true);
            menu.wait(2000);
            menu.freeMenu(menuDaftar5);
            // "  Register   "
            // " Email Anda  "
            // "user001@gmail"
            // "Password Anda"
            // "user001"
            auto menuDaftar6 = menu.createMenu(2, "  Register   ", "  Berhasil   ");
            menu.showMenu(menuDaftar6, true);
            menu.wait(2000);
            menu.freeMenu(menuDaftar6);
          } else {
            auto menuDaftar7 = menu.createMenu(2, "  Register   ", "    Gagal    ");
            menu.showMenu(menuDaftar7, true);
            menu.wait(2000);
            menu.freeMenu(menuDaftar7);
          }
          // menu.setState(menuUtama, "Daftar Akun", 1);
        }
      }
    });
  menu.showMenu(menuUtama);
}