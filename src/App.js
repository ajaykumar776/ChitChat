import React, { useRef, useState, useEffect } from 'react';
import './App.css';
import firebase from 'firebase/app';
import 'firebase/firestore';
import 'firebase/auth';

import { useAuthState } from 'react-firebase-hooks/auth';
import { useCollectionData } from 'react-firebase-hooks/firestore';

firebase.initializeApp({
  apiKey: "AIzaSyB6Qs0v2RRE_1ABpI9kHapjOCdL4QzmrWI",
  authDomain: "floatr-chit-chat.firebaseapp.com",
  projectId: "floatr-chit-chat",
  storageBucket: "floatr-chit-chat.appspot.com",
  messagingSenderId: "15185903267",
  appId: "1:15185903267:web:3f638a16b746bdafe30916"
})

const auth = firebase.auth();
const firestore = firebase.firestore();


function App() {
  const [user] = useAuthState(auth);
  const [chatHeading, setChatHeading] = useState('ChitChat');

  useEffect(() => {
    const storedHeading = localStorage.getItem('chatHeading');
    if (storedHeading) {
      setChatHeading(storedHeading);
    }
  }, []);

  const handleHeadingChange = (e) => {
    const newHeading = e.target.innerText;
    localStorage.setItem('chatHeading', newHeading);
  };

  return (
    <div className="App">
      <header>
        <h2 contentEditable="true" onBlur={(e) => handleHeadingChange(e)}>
          {chatHeading}
        </h2>
        <SignOut />
      </header>

      <section>
        {user ? <ChatRoom /> : <SignIn />}
      </section>
    </div>
  );
}

function SignIn() {

  const signInWithGoogle = () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider);
  }

  return (
    <>
      <button className="sign-in" onClick={signInWithGoogle}>Sign in with Google</button>
    </>
  )

}

function SignOut() {
  return auth.currentUser && (
    <button className="sign-out" onClick={() => auth.signOut()}>Sign Out</button>
  )
}



function ChatRoom() {
  const dummy = useRef();
  const messagesRef = firestore.collection('messages');
  const query = messagesRef.orderBy('createdAt');

  const [messages] = useCollectionData(query, { idField: 'id' });

  const [formValue, setFormValue] = useState('');
  const sendMessage = async (e) => {
    e.preventDefault();

    if (formValue.trim() === '') {
      return; // Don't send empty messages
    }

    const { uid, photoURL } = auth.currentUser;

    await messagesRef.add({
      text: formValue,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      uid,
      photoURL,
    });

    setFormValue('');
    dummy.current.scrollIntoView({ behavior: 'smooth' });
  };
  return (
    <>
      <main>

        {messages &&
          messages.map((msg, index) => (
            <ChatMessage
              key={msg.id}
              message={msg}
              isSameUserAsPrevious={() => {
                const isSameUser =
                  index > 0 && msg.uid === messages[index - 1].uid;
                return isSameUser;
              }}
            />
          ))}
        <span ref={dummy}></span>
      </main>

      <form onSubmit={sendMessage}>

        <input value={formValue} onChange={(e) => setFormValue(e.target.value)} placeholder="Type here" />
        <button type="submit" disabled={!formValue.trim()}>
          <span role="img" aria-label="Send message">
          </span>
          Send
        </button>
      </form>
    </>
  );
}

function ChatMessage(props) {
  const { text, uid, photoURL, createdAt } = props.message;
  const currentUser = auth.currentUser;
  const isSentByCurrentUser = uid === currentUser?.uid;
  const isSameUserAsPrevious = props.isSameUserAsPrevious;
  const messageTime = createdAt
    ? new Date(createdAt.toMillis()).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
    })
    : '';
  const renderProfileImage = () => {
    if (!isSentByCurrentUser && (!isSameUserAsPrevious || !isSameUserAsPrevious())) {
      return (
        <img
          src={photoURL || 'https://api.adorable.io/avatars/23/abott@adorable.png'}
          alt=""
        />
      );
    }
    return null;
  };

  const messageClass = isSentByCurrentUser ? 'sent' : 'received';
  return (
    <>
      <div className={`message ${messageClass}`}>
        {renderProfileImage()}
        <p
          className={renderProfileImage() === null ? 'with-margin' : ''}
          title={isSentByCurrentUser ? 'You' : currentUser.displayName}
        >
          {text}
        </p>

      </div>
      <span className={`message-time-${messageClass}`}>{messageTime}</span>
    </>
  );
}
export default App;
