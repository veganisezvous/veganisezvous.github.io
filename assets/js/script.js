$(document).ready(function () {

	paddingTopWrapper();

	$('.burger').on('click', function() {
		$('.nav__wrapper').addClass('--is-active');
	});

	$('.close, .overlay').on('click', function() {
		$('.nav__wrapper').removeClass('--is-active');
	});


});

function paddingTopWrapper() {

	const body = $('body#index');
	const wrapper = $('.main');
	const header = $('header').height();

	if (body.length) {
		wrapper.css('padding-top' , header + 'px');
	}
	else {
		wrapper.css('padding-top' , 0);
	}

}
