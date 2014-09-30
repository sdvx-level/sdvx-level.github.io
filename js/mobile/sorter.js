/*  Document on pagecreate #index
 *  1. 在手機上關閉 scroll bar，因為會誤按
 *  2. window resize 時自動修正右方 bar 高度
 *  3. 設定點擊 bar 時跳轉的 event
 *  4. 產生 score page 的內容
 *  5. 
 */
$.mobile.document.on("pagecreate", "#index", function () {
    // 關閉手機 scroll bar
    if (isMobile()) {
        disableScrollBar();
    }

    // 自動修正右方的 bar 高度
    resizeBarHeight();
    // 設定當 window resize 的時候自動修正右方 bar 高度
    $(window).resize(resizeBarHeight);

    // 設定點擊右方 bar 時需要自動跳到相對應的 score 位置
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

    // 產生 score page 的資料
    for (var score = 6; score >= -6; --score) {
        appendSongsByScoreAndLevel(score, 15, "Score " + score);
    }
    appendSongsByScoreAndLevel(100, 15, "個人差");
    appendSongsByScoreAndLevel(-100, 15, "未排入");

    // 設定 popup 的 event
    $(document).on("popupbeforeposition", ".ui-popup", function () {
        // 設定圖片高度與最大高度
        var image = $(this).children("img"),
            height = image.height(),
            width = image.width();
        $(this).attr({ "height": height, "width": width });
        var max_height = $(window).height() - 68 + "px";
        $("img.photo", this).css("max-height", max_height);
        // 設定 popup 的 width
        if ($(window).width() * 0.9 > 300)
            $(this).parent().width("300px");
        else
            $(this).parent().width("90%");
        // 設定當 popup 出現時，禁止滑動
        $("body").on("touchmove", false);
        $("body").addClass("no_scroll");
    });
    $(document).on("popupafterclose", ".ui-popup", function () {
        // 刪除 popup instance
        $(this).remove();
        // 重新啟動滑動
        $("body").unbind("touchmove");
        $("body").removeClass("no_scroll");
    });
});

function isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

function disableScrollBar() {
    $("body").addClass("no_scroll");
}

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

function appendSongsByScoreAndLevel(score, level, header_name) {
    var song_list_dom = $("#songList");
    song_list_dom.append("<div data-role=\"collapsible\" data-collapsed=\"false\" data-collapsed-icon=\"carat-d\" data-expanded-icon=\"carat-u\" id=\"score" + score + "\"></div>");
    var score_dom = song_list_dom.find("div:last");
    score_dom.append("<h4>" + header_name + "</h4>");
    var db_result = music_db({ level: level, score: score }).order("title asec");
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