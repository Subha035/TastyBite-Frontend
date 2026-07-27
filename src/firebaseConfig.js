import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyBRnh8y8oDR6nnHsO4wF0pP0t4ORQGMRoU',
  authDomain: 'project-726fff49-a0ad-4aa8-990.firebaseapp.com',
  projectId: 'project-726fff49-a0ad-4aa8-990',
  storageBucket: 'project-726fff49-a0ad-4aa8-990.firebasestorage.app',
  messagingSenderId: '720242633319',
  appId: '1:720242633319:web:75ef6a201ec54dfe55c2c2',
  measurementId: 'G-PCM4HJGFGL'
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const ADMIN_EMAIL = 'tastyadmin@tastybite.com';
const ADMIN_PASSWORD = 'TastyAdmin@035';

export { auth, ADMIN_EMAIL, ADMIN_PASSWORD };
