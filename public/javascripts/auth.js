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
