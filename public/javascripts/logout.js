firebase.auth().signOut().then(() => {
  window.location.replace('/');
}).catch((error) => {
  window.location.replace('/');
});
