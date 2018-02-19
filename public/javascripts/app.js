const config = {
    apiKey: 'AIzaSyDEbzhEvdQWpQ4UhIdQZyi1nWLytADxfDM',
    authDomain: 'tapasmedia-co-api-tapastic-android.firebaseapp.com',
    databaseURL: 'https://tapasmedia-co-api-tapastic-android.firebaseio.com',
    projectId: 'tapasmedia.co:api-tapastic-android'
  };
firebase.initializeApp(config);

firebase.auth().onAuthStateChanged(function(user) {
  if (user) {
    console.log(user.uid)
  } else {
    new firebaseui.auth.AuthUI(firebase.auth()).start('#firebaseui-auth-container', {
      signInSuccessUrl: '/',
      signInOptions: [
        firebase.auth.EmailAuthProvider.PROVIDER_ID,
      ],
      credentialHelper: firebaseui.auth.CredentialHelper.NONE,
    });
  }
});
