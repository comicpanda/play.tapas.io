const config = {
    apiKey: 'AIzaSyDEbzhEvdQWpQ4UhIdQZyi1nWLytADxfDM',
    authDomain: 'tapasmedia-co-api-tapastic-android.firebaseapp.com',
    databaseURL: 'https://tapasmedia-co-api-tapastic-android.firebaseio.com',
    projectId: 'tapasmedia.co:api-tapastic-android'
  };
firebase.initializeApp(config);

firebase.auth().onAuthStateChanged(user => {
  if (user) {
    $('#auth-form').append(`<input name="uid" type="hidden" value="${user.uid}"/>`).submit();
  } else {
    new firebaseui.auth.AuthUI(firebase.auth()).start('#firebaseui-auth-container', {
      signInSuccessUrl: '/',
      signInOptions: [
        firebase.auth.EmailAuthProvider.PROVIDER_ID,
      ],
      credentialHelper: firebaseui.auth.CredentialHelper.NONE,
      callbacks: {
        signInSuccess: (currentUser, credential, redirectUrl) => {
          return false;
        }
      }
    });
  }
});
