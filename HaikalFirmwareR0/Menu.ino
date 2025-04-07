void lcdMenuCallback() {
  // "             "
  // " Pengecekan  "
  // "    RFID     "

  // " RFID Master "
  // "  Terdaftar  "
  static auto menuUtama = menu.createMenu(2, "Bayar", "Daftar Akun");
  menu.onSelect(menuUtama, "Daftar Akun", [](int state) {
    if (state == 0) {
      static auto menuDaftarAkun0 = menu.createMenu(2, " Silakan Tap ", " Master RFID ");
      menu.showMenu(menuDaftarAkun0);
      if (!uuidRFID.isEmpty()) {
        menu.setState(menuUtama, "Daftar Akun", 1);
      }
    } else if (state == 1) {
      auto menuDaftarAkun1 = menu.createMenu(2, " Pengecekan  ", "    RFID     ");
      menu.showMenu(menuDaftarAkun1, true);
      menu.wait(2000);
      menu.freeMenu(menuDaftarAkun1);
    }
  });
  menu.showMenu(menuUtama);
}