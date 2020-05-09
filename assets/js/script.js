$(document).ready(function () {

	$('.burger').on('click', function() {
		$('.nav__wrapper').addClass('--is-active');
	});

	$('.close, .overlay').on('click', function() {
		$('.nav__wrapper').removeClass('--is-active');
	});

});


