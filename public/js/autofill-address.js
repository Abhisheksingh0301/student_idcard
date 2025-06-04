// public/js/autofill-address.js
$(document).ready(function () {
  $('#pincode').on('input change', function () {
    const pincode = $(this).val();

    console.log("PIN entered:", pincode);

    if (pincode.length === 6) {
      $.get(`https://api.postalpincode.in/pincode/${pincode}`, function (data) {
        if (data[0].Status === "Success") {
          const postOffice = data[0].PostOffice[0];
          $('#district').val(postOffice.District.toUpperCase());
          $('#state').val(postOffice.State.toUpperCase());
        } else {
          alert("Invalid PIN code");
          $('#district').val('');
          $('#state').val('');
        }
      });
    }
  });
});
