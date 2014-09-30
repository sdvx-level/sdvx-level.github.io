$.mobile.document.on("pagecreate", "#index", function () {
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        $("body").addClass("no_scroll");
    }

    // auto set bar height
    resizeBarHeight();
    // set on resize
    $(window).resize(resizeBarHeight);

    $.mobile.document.on("click", "#sorter li", function() {
        var top,
            letter = $(this).data("score"),
            divider = $("#score" + letter);
        if (divider.length > 0) {
            top = divider.offset().top;
            $.mobile.silentScroll(top);
        } else {
            return;
        }
    });

    // generate page content
    for (var score = 6; score >= -6; --score) {
        appendSongsByScore(score, "Score " + score);
    }
    appendSongsByScore(100, "個人差");
    appendSongsByScore(-100, "未排入");
    // set
    $(document).on("popupbeforeposition", ".ui-popup", function() {
        var image = $(this).children("img"),
            height = image.height(),
            width = image.width();
        $(this).attr({ "height": height, "width": width });
        var max_height = $(window).height() - 68 + "px";
        $("img.photo", this).css("max-height", max_height);
        if ($(window).width() * 0.9 > 300)
            $(this).parent().width("300px");
        else
            $(this).parent().width("90%");
        $("body").on("touchmove", false);
    });
    $(document).on("popupafterclose", ".ui-popup", function() {
        $(this).remove();
        $("body").unbind("touchmove");
    });
});

function resizeBarHeight() {
    $("#sorter ul li").css("height", (($(window).height() - ($("#sorter ul li").length - 1)) / $("#sorter ul li").length).toString() + "px");
    $("#sorter ul li").css("line-height", (($(window).height() - ($("#sorter ul li").length - 1)) / $("#sorter ul li").length).toString() + "px");
}

function getTitleByNameAndType(name, type) {
    if (type == 1)
        return name + " [NOV]";
    if (type == 2)
        return name + " [ADV]";
    if (type == 3)
        return name + " [EXH]";
    if (type == 4)
        return name + " [INF]";
    else return "";
};

function appendSongsByScore(score, header_name) {
    var song_list_dom = $("#songList");
    song_list_dom.append("<div data-role=\"collapsible\" data-collapsed=\"false\" data-collapsed-icon=\"carat-d\" data-expanded-icon=\"carat-u\" id=\"score" + score + "\"></div>");
    var score_dom = song_list_dom.find("div:last");
    score_dom.append("<h4>" + header_name + "</h4>");
    var db_result = music_db({ score: score }).order("title asec");
    if (db_result.count() != 0) {
        db_result.each(function (entry) {
            score_dom.append("<img src=\"img/" + entry.value + " " + entry.type + ".png\" data-filtertext=\"" + entry.title + "\" />");

            // create click event
            score_dom.find("img:last").on("click", function () {
                var target = $(this),
                    brand = getTitleByNameAndType(entry.title, entry.type),
                    pic_fn = entry.value + " " + entry.type,
                    closebtn = '<a href="#" data-rel="back" class="ui-btn ui-corner-all ui-btn-a ui-icon-delete ui-btn-icon-notext ui-btn-right">Close</a>',
                    header = '<div data-role="header"><h4>' + brand + '</h4></div>',
                    img = '<img src="img/' + pic_fn + '.png" alt="' + brand + '" class="photo"><br />',
                    popup = '<div class="popup_info" data-role="popup" id="popup" data-theme="b" data-overlay-theme="b" data-corners="true" data-shadow="true" data-tolerance="30,15,30,15"></div>';

                var info = '<div class="ui-grid-a">';
                function addLeftBlock(name) {
                    return '<div class="ui-block-a block-left">' + name + '</div>';
                };
                function addRightBlock(id, value) {
                    return '<div class="ui-block-b block-right"><input id="' + id + '" type="range" value="' + value + '" min="0" max="11" data-highlight="true" data-mini="true" data-track-theme="b" /></div>';
                };
                info += addLeftBlock("短鍵"); // + addLeftBlock("長短混合") + addLeftBlock("旋鈕") + addLeftBlock("腦力訓練") + addLeftBlock("節奏") + addLeftBlock("演出陷阱");
                info += addRightBlock("song_info_short_btn", entry.short_btn);
                info += addLeftBlock("長短混合");
                info += addRightBlock("song_info_short_long_mix", entry.short_long_mix);
                info += addLeftBlock("旋鈕");
                info += addRightBlock("song_info_analog", entry.analog);
                info += addLeftBlock("腦力訓練");
                info += addRightBlock("song_info_brain_train", entry.brain_train);
                info += addLeftBlock("節奏");
                info += addRightBlock("song_info_rythm", entry.rythm);
                info += addLeftBlock("演出陷阱");
                info += addRightBlock("song_info_trap", entry.trap);
                info += '</div>';
                /*
                info += "短鍵: " + entry.short_btn + "<br />";
                info += "長短混合: " + entry.short_long_mix + "<br />";
                info += "旋鈕: " + entry.analog + "<br />";
                info += "腦力訓練: " + entry.brain_train + "<br />";
                info += "節奏: " + entry.rythm + "<br />";
                info += "演出陷阱: " + entry.trap + "<br />";
                */

                $(header)
                    .appendTo($(popup)
                        .appendTo($.mobile.activePage)
                        .popup())
                    .toolbar()
                    .before(closebtn)
                    .after(img + info);

                $("#popup").popup("open", { transition: "flip", positionTo: "window" });
                $(".block-right > input").slider({
                    create: function(event, ui) {
                        $(this).parent().find('input').hide();
                        // $(this).parent().find('input').css('margin-left','-9999px'); // Fix for some FF versions
                        $(this).parent().find('.ui-slider-track').css('margin', '0 15px 0 15px');
                        $(this).parent().find('.ui-slider-handle').hide();

                        // set height to equal
                        var tallest = 0;
                        $('.ui-grid-a > div').each(function () {
                            var this_height = $(this).height();
                            if (this_height > tallest) {
                                tallest = this_height;
                            }
                        });
                        $('.ui-grid-a > div').height(tallest);
                        $('.ui-grid-a > .ui-block-a').css("line-height", tallest.toString() + "px");
                    },
                    disabled: true
                });
            });
        });
    }
    $('div[data-role=collapsible]').collapsible({
        collapse: function (event, ui) {
            $(this).children().next().slideUp(150);
        },
        expand: function (event, ui) {
            $(this).children().next().hide();
            $(this).children().next().slideDown(150);
        }
    });
}