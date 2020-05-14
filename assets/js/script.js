$(document).ready(function () {

	if ($("body").is("#crueltyfree")) {

		new accordions();

	}

	paddingTopWrapper();

	const burger = $('.burger');

	burger.on('click', function() {
		$('.nav__wrapper').addClass('--is-active');
		burger.addClass('--is-active');
	});

	$('.close, .overlay').on('click', function() {
		$('.nav__wrapper').removeClass('--is-active');
		burger.removeClass('--is-active');
	});


});

function paddingTopWrapper() {

	const body = $('body');
	const wrapper = $('section.main');
	const header = $('header').innerHeight();

	// if (window.matchMedia("(min-width : 1024px)").matches) {
		if (body.length) {
			wrapper.css('padding-top' , header + 'px');
		}
		else {
			wrapper.css('padding-top' , 0);
		}
	// }



}
