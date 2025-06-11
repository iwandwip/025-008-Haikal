import { 
  collection, 
  getDocs, 
  query, 
  where
} from 'firebase/firestore';
import { db } from './firebase';
import { signUpWithEmail } from './authService';
import { checkEmailExists } from './authService';

class SeederService {
  constructor() {
    this.namaSantriList = [
      'Ahmad Fauzi', 'Siti Aisyah', 'Muhammad Rizki', 'Fatimah Zahra', 'Ali Hassan',
      'Khadijah Nur', 'Umar Faruq', 'Zainab Salma', 'Yusuf Ibrahim', 'Maryam Sari',
      'Khalid Rahman', 'Aisha Dewi', 'Ibrahim Malik', 'Hafsa Putri', 'Salman Hakim',
      'Ruqayyah Indah', 'Hamza Wijaya', 'Sumayyah Lestari', 'Bilal Pratama', 'Ummu Kulthum',
      'Abdullah Surya', 'Safiyyah Wati', 'Uthman Bagus', 'Juwayriyah Sari', 'Mu\'adh Ramdan',
      'Zulaikha Fitri', 'Sa\'ad Permana', 'Rabiah Cantika', 'Zayd Pratomo', 'Ummu Salamah'
    ];

    this.namaWaliList = [
      'Bapak Agus Santoso', 'Ibu Siti Rahayu', 'Bapak Joko Widodo', 'Ibu Fitri Handayani', 'Bapak Andi Susanto',
      'Ibu Dewi Sartika', 'Bapak Bambang Hermawan', 'Ibu Rina Marlina', 'Bapak Dedi Kurniawan', 'Ibu Maya Sari',
      'Bapak Hendra Gunawan', 'Ibu Lina Kartini', 'Bapak Rudi Hartono', 'Ibu Novi Anggraini', 'Bapak Irwan Setiawan',
      'Ibu Tuti Wulandari', 'Bapak Budi Prasetyo', 'Ibu Eka Purwanti', 'Bapak Danu Wijaya', 'Ibu Sri Wahyuni',
      'Bapak Fajar Ramadhan', 'Ibu Indah Permata', 'Bapak Gilang Pratama', 'Ibu Lia Kusuma', 'Bapak Yudi Setiawan',
      'Ibu Ratna Dewi', 'Bapak Adi Nugroho', 'Ibu Vina Handayani', 'Bapak Reza Firmansyah', 'Ibu Diana Sari'
    ];
  }

  generateRandomRFID() {
    const chars = '0123456789ABCDEF';
    let rfid = '';
    for (let i = 0; i < 8; i++) {
      rfid += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return rfid;
  }

  generateRandomPhone() {
    const prefixes = ['0812', '0813', '0821', '0822', '0823', '0851', '0852', '0853'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const suffix = Math.floor(Math.random() * 90000000) + 10000000;
    return `${prefix}${suffix}`;
  }

  getRandomName(nameList) {
    return nameList[Math.floor(Math.random() * nameList.length)];
  }

  generateRandomUserNumber() {
    return Math.floor(Math.random() * 9000) + 1000;
  }

  async generateUniqueEmail() {
    const maxRetries = 100;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const userNumber = this.generateRandomUserNumber();
      const email = `user${userNumber}@gmail.com`;
      
      try {
        const emailCheck = await checkEmailExists(email);
        
        if (emailCheck.success && !emailCheck.exists) {
          return { success: true, email: email, userNumber: userNumber };
        }
        
        if (!emailCheck.success) {
          console.warn(`Error checking email ${email}:`, emailCheck.error);
        }
        
      } catch (error) {
        console.warn(`Error on attempt ${attempt + 1} for email ${email}:`, error);
      }
    }
    
    return { 
      success: false, 
      error: `Tidak dapat menemukan email unik setelah ${maxRetries} percobaan`
    };
  }

  async createSeederUsers(count = 3) {
    try {
      const results = [];
      const errors = [];

      for (let i = 0; i < count; i++) {
        try {
          const emailResult = await this.generateUniqueEmail();
          
          if (!emailResult.success) {
            errors.push({
              index: i + 1,
              error: emailResult.error
            });
            continue;
          }

          const email = emailResult.email;
          const password = 'admin123';
          
          const profileData = {
            namaSantri: this.getRandomName(this.namaSantriList),
            namaWali: this.getRandomName(this.namaWaliList),
            noHpWali: this.generateRandomPhone(),
            rfidSantri: this.generateRandomRFID(),
            role: 'user'
          };

          const result = await signUpWithEmail(email, password, profileData);
          
          if (result.success) {
            results.push({
              email,
              userNumber: emailResult.userNumber,
              namaSantri: profileData.namaSantri,
              namaWali: profileData.namaWali,
              rfidSantri: profileData.rfidSantri,
              noHpWali: profileData.noHpWali
            });
          } else {
            errors.push({
              email,
              userNumber: emailResult.userNumber,
              error: result.error
            });
          }
        } catch (error) {
          errors.push({
            index: i + 1,
            error: error.message
          });
        }

        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      return {
        success: true,
        created: results,
        errors: errors,
        totalCreated: results.length,
        totalErrors: errors.length
      };

    } catch (error) {
      console.error('Error in createSeederUsers:', error);
      return {
        success: false,
        error: error.message,
        created: [],
        errors: [],
        totalCreated: 0,
        totalErrors: 0
      };
    }
  }

  async getSeederStats() {
    try {
      if (!db) {
        return { total: 0, seederUsers: 0 };
      }

      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('role', '==', 'user'));

      const querySnapshot = await getDocs(q);
      
      let totalUsers = 0;
      let seederUsers = 0;

      querySnapshot.forEach((doc) => {
        const userData = doc.data();
        totalUsers++;
        
        if (userData.email && userData.email.match(/user\d{4}@gmail\.com/)) {
          seederUsers++;
        }
      });

      return {
        total: totalUsers,
        seederUsers: seederUsers
      };
    } catch (error) {
      console.error('Error getting seeder stats:', error);
      return { total: 0, seederUsers: 0 };
    }
  }
}

export const seederService = new SeederService();