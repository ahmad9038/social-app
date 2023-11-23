document.addEventListener("DOMContentLoaded", function () {
  const urlSearchParams = new URLSearchParams(window.location.search);
  const userId = urlSearchParams.get("id");

  const userIdInput = document.getElementById("userId");
  userIdInput.value = userId;
});
