import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInAnonymously } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import * as firestore from 'firebase/firestore';

// Detect if the user is using placeholder configuration
const isPlaceholder = !firebaseConfig.projectId || 
                      firebaseConfig.projectId.includes('remixed-') || 
                      firebaseConfig.apiKey.includes('remixed-');

let app: any;
let dbInstance: any;
let authInstance: any;

if (!isPlaceholder) {
  try {
    app = initializeApp(firebaseConfig);
    dbInstance = getFirestore(app, firebaseConfig.firestoreDatabaseId);
    authInstance = getAuth(app);
  } catch (error) {
    console.warn("Could not connect to Firebase, falling back to local mode:", error);
  }
}

// 1. Export database configs
export const db = dbInstance || { isMock: true };
export const auth = authInstance || {
  currentUser: {
    uid: 'guest-user',
    email: 'guest@example.com',
    emailVerified: true,
    isAnonymous: true,
    tenantId: null,
    providerData: []
  },
  signOut: async () => {},
  onAuthStateChanged: (callback: any) => {
    callback({ uid: 'guest-user', email: 'guest@example.com' });
    return () => {};
  }
};

export const googleProvider = !isPlaceholder ? new GoogleAuthProvider() : {};

export const signIn = () => {
  if (isPlaceholder) {
    return Promise.resolve({ user: auth.currentUser });
  } else {
    return signInAnonymously(authInstance);
  }
};

export const signOut = () => {
  if (isPlaceholder) {
    return Promise.resolve();
  } else {
    return authInstance.signOut();
  }
};

// --- LOCAL STORAGE BACKEND SIMULATOR ---

const INITIAL_MEMORIES = [
  {
    id: 'mem-1',
    title: 'Buổi Hẹn Đầu Tiên rực rỡ',
    date: '2026-05-10',
    mediaUrls: ['https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=1000'],
    mediaType: 'image',
    author: 'duPO',
    userId: 'guest-user',
    songTitle: 'Perfect - Ed Sheeran',
    note: 'Lần đầu tiên gặp gỡ, anh đã biết em chính là mảnh ghép còn thiếu của đời mình. Quán cafe nhỏ, nụ cười em làm bừng sáng cả không gian.',
    musicUrl: '/dummy.mp3',
    createdAt: { seconds: Math.floor(Date.now() / 1000) - 200000, nanoseconds: 0 }
  },
  {
    id: 'mem-2',
    title: 'Dưới Chiều Hoàng Hôn Hồ Tây',
    date: '2026-05-20',
    mediaUrls: ['https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&q=80&w=1000'],
    mediaType: 'image',
    author: 'xurry',
    userId: 'guest-user',
    songTitle: 'Until I Found You - Stephen Sanchez',
    note: 'Gió Hồ Tây mát rượi, tay trong tay đi dạo thật bình yên. Mong chúng ta mãi ngọt ngào như những buổi chiều muộn ngập tràn sắc hồng này.',
    musicUrl: '/dummy.mp3',
    createdAt: { seconds: Math.floor(Date.now() / 1000) - 100000, nanoseconds: 0 }
  },
  {
    id: 'mem-3',
    title: 'Cơn Mưa Rào Tháng Năm',
    date: '2026-05-25',
    mediaUrls: ['https://images.unsplash.com/photo-1515488042361-404e92539b20?auto=format&fit=crop&q=80&w=1000'],
    mediaType: 'image',
    author: 'duPO',
    userId: 'guest-user',
    songTitle: 'Lover - Taylor Swift',
    note: 'Chạy mưa rào ướt nhẹp nhưng mà vui cười toe toét. Cảm ơn em đã đi cùng anh qua mọi giông bão cuộc đời.',
    musicUrl: '/dummy.mp3',
    createdAt: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 }
  }
];

const INITIAL_PHOTOS_DUPO = [
  {
    id: 'photo-d1',
    category: 'dupo',
    imageUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=600',
    title: 'Smile boy 2026',
    createdAt: { seconds: 1770000100, nanoseconds: 0 }
  },
  {
    id: 'photo-d2',
    category: 'dupo',
    imageUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=600',
    title: 'Hoàng hôn rực rỡ',
    createdAt: { seconds: 1770000200, nanoseconds: 0 }
  }
];

const INITIAL_PHOTOS_XURRY = [
  {
    id: 'photo-x1',
    category: 'xurry',
    imageUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=600',
    title: 'Nhi xinh xắn rạng ngời',
    createdAt: { seconds: 1770000300, nanoseconds: 0 }
  },
  {
    id: 'photo-x2',
    category: 'xurry',
    imageUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=600',
    title: 'Ngày bình yên dạo phố',
    createdAt: { seconds: 1770000400, nanoseconds: 0 }
  }
];

const DEFAULT_SETTINGS = {
  dupoCover: 'https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?auto=format&fit=crop&q=80&w=1200',
  xurryCover: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=1200'
};

function getStoredCollection(path: string): any[] {
  const dataStr = localStorage.getItem(`dateapp_col_${path}`);
  if (dataStr) {
    try {
      return JSON.parse(dataStr);
    } catch (e) {
      console.error("Failed to parse collection", path, e);
    }
  }
  
  if (path === 'memories') {
    localStorage.setItem(`dateapp_col_memories`, JSON.stringify(INITIAL_MEMORIES));
    return INITIAL_MEMORIES;
  }
  if (path === 'personal_photos') {
    const combinedPhotos = [...INITIAL_PHOTOS_DUPO, ...INITIAL_PHOTOS_XURRY];
    localStorage.setItem(`dateapp_col_personal_photos`, JSON.stringify(combinedPhotos));
    return combinedPhotos;
  }
  return [];
}

function setStoredCollection(path: string, list: any[]) {
  localStorage.setItem(`dateapp_col_${path}`, JSON.stringify(list));
  notifyPathChange(path, 'collection');
}

function getStoredDocument(path: string): any | null {
  const dataStr = localStorage.getItem(`dateapp_doc_${path}`);
  if (dataStr) {
    try {
      return JSON.parse(dataStr);
    } catch (e) {
      console.error("Failed to parse document", path, e);
    }
  }
  
  if (path === 'settings/global') {
    localStorage.setItem(`dateapp_doc_${path}`, JSON.stringify(DEFAULT_SETTINGS));
    return DEFAULT_SETTINGS;
  }
  return null;
}

function setStoredDocument(path: string, data: any) {
  const existing = getStoredDocument(path) || {};
  const updated = { ...existing, ...data };
  localStorage.setItem(`dateapp_doc_${path}`, JSON.stringify(updated));
  notifyPathChange(path, 'document');
}

interface Listener {
  id: string;
  target: any;
  callback: (snapshot: any) => void;
}
let listeners: Listener[] = [];

function triggerListener(listener: Listener) {
  const { target, callback } = listener;
  
  if (target.type === 'document') {
    const docData = getStoredDocument(target.path);
    callback({
      id: target.path.split('/').pop() || '',
      exists: () => docData !== null,
      data: () => docData || {}
    });
  } else {
    let list = getStoredCollection(target.path);
    
    if (target.params && Array.isArray(target.params)) {
      for (const param of target.params) {
        if (!param) continue;
        if (param.type === 'where') {
          const { field, op, value } = param;
          if (op === '==') {
            list = list.filter((item: any) => item[field] === value);
          }
        }
        if (param.type === 'orderBy') {
          const { field, direction } = param;
          list = [...list].sort((a: any, b: any) => {
            const valA = a[field];
            const valB = b[field];
            if (valA === undefined || valB === undefined) return 0;
            if (valA < valB) return direction === 'asc' ? -1 : 1;
            if (valA > valB) return direction === 'asc' ? 1 : -1;
            return 0;
          });
        }
      }
    }
    
    callback({
      docs: list.map((item: any) => ({
        id: item.id || '',
        data: () => item
      }))
    });
  }
}

function notifyPathChange(path: string, type: 'collection' | 'document') {
  listeners.forEach(listener => {
    if (type === 'collection' && listener.target.path === path) {
      triggerListener(listener);
    } else if (type === 'document' && listener.target.path === path) {
      triggerListener(listener);
    }
  });
}

// Mock Firestore implementations:
const mockCollection = (database: any, path: string) => ({ type: 'collection', path });
const mockDoc = (database: any, ...args: string[]) => {
  let path = '';
  if (args.length === 1) {
    path = args[0];
  } else if (args.length === 2) {
    path = `${args[0]}/${args[1]}`;
  }
  return { type: 'document', path };
};
const mockQuery = (col: any, ...queryParams: any[]) => ({
  type: 'query',
  path: col.path,
  params: queryParams
});
const mockOrderBy = (field: string, direction: 'asc' | 'desc' = 'asc') => ({ type: 'orderBy', field, direction });
const mockWhere = (field: string, op: string, value: any) => ({ type: 'where', field, op, value });

const mockOnSnapshot = (target: any, callback: (snapshot: any) => void) => {
  const listenerId = Math.random().toString(36).substring(2);
  const listener = { id: listenerId, target, callback };
  listeners.push(listener);
  
  setTimeout(() => {
    triggerListener(listener);
  }, 0);
  
  return () => {
    listeners = listeners.filter(l => l.id !== listenerId);
  };
};

const mockAddDoc = async (colRef: any, data: any) => {
  const list = getStoredCollection(colRef.path);
  const newId = 'doc-' + Date.now() + '-' + Math.random().toString(36).substring(7);
  const newDoc = {
    id: newId,
    ...data,
    createdAt: data.createdAt && data.createdAt.type === 'serverTimestamp' 
      ? { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 } 
      : data.createdAt
  };
  list.push(newDoc);
  setStoredCollection(colRef.path, list);
  return { id: newId };
};

const mockUpdateDoc = async (docRef: any, data: any) => {
  if (!docRef.path.includes('/')) {
    return;
  }
  const parts = docRef.path.split('/');
  const colPath = parts[0];
  const docId = parts[1];
  
  if (colPath === 'settings') {
    setStoredDocument(docRef.path, data);
  } else {
    const list = getStoredCollection(colPath);
    const index = list.findIndex(item => item.id === docId);
    if (index !== -1) {
      list[index] = { ...list[index], ...data };
      setStoredCollection(colPath, list);
    }
  }
};

const mockSetDoc = async (docRef: any, data: any, options?: any) => {
  setStoredDocument(docRef.path, data);
};

const mockDeleteDoc = async (docRef: any) => {
  const parts = docRef.path.split('/');
  if (parts.length >= 2) {
    const colPath = parts[0];
    const docId = parts[1];
    let list = getStoredCollection(colPath);
    list = list.filter(item => item.id !== docId);
    setStoredCollection(colPath, list);
  }
};

const mockServerTimestamp = () => ({ type: 'serverTimestamp' });
const mockGetDocFromServer = async (docRef: any) => {
  const docData = getStoredDocument(docRef.path);
  return {
    id: docRef.path.split('/').pop() || '',
    exists: () => docData !== null,
    data: () => docData || {}
  };
};

// Unified dynamic exports
export const collection = isPlaceholder ? mockCollection : firestore.collection;
export const doc = isPlaceholder ? mockDoc : firestore.doc;
export const query = isPlaceholder ? mockQuery : firestore.query;
export const orderBy = isPlaceholder ? mockOrderBy : firestore.orderBy;
export const where = isPlaceholder ? mockWhere : firestore.where;
export const onSnapshot = isPlaceholder ? mockOnSnapshot : (firestore.onSnapshot as any);
export const addDoc = isPlaceholder ? mockAddDoc : firestore.addDoc;
export const updateDoc = isPlaceholder ? mockUpdateDoc : firestore.updateDoc;
export const setDoc = isPlaceholder ? mockSetDoc : firestore.setDoc;
export const deleteDoc = isPlaceholder ? mockDeleteDoc : firestore.deleteDoc;
export const serverTimestamp = isPlaceholder ? mockServerTimestamp : firestore.serverTimestamp;
export const getDocFromServer = isPlaceholder ? mockGetDocFromServer : firestore.getDocFromServer;
