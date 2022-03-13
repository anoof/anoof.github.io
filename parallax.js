var doParallax = () => {
	// 	c4left = document.getElementById ( '#l4' ).offsetLeft, later for dustbin layer
	// 	c4top = document.getElementById ( '#l4' ).offsetTop;
	var parallaxBox = document.getElementById("parallax_container");
	var c1left = document.getElementById("l1").getBoundingClientRect().left + 10,
		c1top = document.getElementById("l1").getBoundingClientRect().top + 5,
		c2left = document.getElementById("l2").getBoundingClientRect().left - 325,
		c2top = document.getElementById("l2").getBoundingClientRect().top + 195,
		c3left = document.getElementById("l3").getBoundingClientRect().left + 90,
		c3top = document.getElementById("l3").getBoundingClientRect().top + 205;

	document.onmousemove = function (event) {
		event = event || window.event;
		var x = event.clientX - parallaxBox.getBoundingClientRect().left,
			y = event.clientY - parallaxBox.getBoundingClientRect().top;
		mouseParallax("l1", c1left, c1top, x, y, 5, 0);
		mouseParallax("l2", c2left, c2top, x, y, 10, 0);
		mouseParallax("l3", c3left, c3top, x, y, 20, 1);
	};
};

var mouseParallax = (id, left, top, mouseX, mouseY, speed, direction) => {
	var obj = document.getElementById(id);
	var parentObj = obj.parentNode,
		containerWidth = parseInt(parentObj.offsetWidth),
		containerHeight = parseInt(parentObj.offsetHeight);
	left = left - 300;
	top = top - 260;
	if (direction > 0) {
		obj.style.left =
			left +
			((mouseX - (parseInt(obj.offsetWidth) / 2 + left)) / containerWidth) *
				speed +
			"px";
		obj.style.top =
			top +
			((mouseY - (parseInt(obj.offsetHeight) / 2 + top)) / containerHeight) *
				speed +
			"px";
	} else {
		obj.style.left =
			left -
			((mouseX - (parseInt(obj.offsetWidth) / 2 + left)) / containerWidth) *
				speed +
			"px";
		obj.style.top =
			top -
			((mouseY - (parseInt(obj.offsetHeight) / 2 + top)) / containerHeight) *
				speed +
			"px";
	}
};

var enableResumedownload = () => {
	var url = "/assets/Resume.pdf";
	var link = document.getElementById("welcome-section_resume");
	link.onclick = () => {
		window.open(url, "_blank");
	};
};

window.onload = function () {
	doParallax();
	enableResumedownload();
};
