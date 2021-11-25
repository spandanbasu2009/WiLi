import * as firebase from "firebase"
require("@firebase/firestore")
const firebaseConfig = {
    apiKey: "AIzaSyB-18mjIau3ouvqWMXekh9ElzxhWeJz8Ks",
    authDomain: "wili-79740.firebaseapp.com",
    projectId: "wili-79740",
    storageBucket: "wili-79740.appspot.com",
    messagingSenderId: "517859756114",
    appId: "1:517859756114:web:f47d036b3dab18ae25f78b"
  };

  firebase.initializeApp(firebaseConfig)
  export default firebase.firestore()