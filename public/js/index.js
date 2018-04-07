$(document).ready(function() {
  $(".add-applicant-name").change(function() {
    if ($(".add-applicant-name").val() !== "")
      $(".add-applicant-submit").removeAttr("disabled")
    else
      $(".add-applicant-submit").attr("disabled")
  })
})
