$(document).ready(function () {

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

	const body = $('body#index');
	const wrapper = $('.main');
	const header = $('header').height();

	if (window.matchMedia("(min-width : 1024)").matches) {
		if (body.length) {
			wrapper.css('padding-top' , header + 'px');
		}
		else {
			wrapper.css('padding-top' , 0);
		}
	}



}
