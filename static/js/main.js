$(document).ready()
{
    $('.get-regions').on('click', function f() {
        event.preventDefault();
        $('.regions-modal').addClass('active');
    });
    $('.close-regions').on('click', function () {
        event.preventDefault();
        $('.regions-modal').removeClass('active');
    });
}
function getImgModal(e) {
    event.preventDefault();
    var urlImg = e.getAttribute('data-url');
    $('#modalImg__img').attr('src', urlImg);
    $('#modalImg').modal('show');
}