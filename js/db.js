var image_size = 128;
var border_size = 6;

var pressTimer;

function saveToLocalStorage() {
    $(".elem").each(function(i) {
        var music_value = $(this).data("music-value");
        if ($(this).hasClass("elem_background"))
            localStorage.setItem(music_value, "1");
        else
            localStorage.setItem(music_value, "0");
    });
    updateLink();
}

function readFromLocalStorage() {
    $(".elem").each(function(i) {
        var music_value = $(this).data("music-value");
        if (localStorage.getItem(music_value) == "1") {
            $(this).addClass("elem_background");
            $(this).find("canvas").setLayer('song_img', { opacity: 1 }).drawLayers();
        } else {
            $(this).removeClass("elem_background");
            $(this).find("canvas").setLayer('song_img', { opacity: 0.2 }).drawLayers();
        }
    });
}

function updateLink() {
    var text = "?rec=";
    for (var i = 0; i < localStorage.length; ++i) {
        text += localStorage.getItem(localStorage.key(i)) + ",";
    }
    text = $.url().attr("host") + $.url().attr("path") + text.substring(0, text.length - 1);
    $("#link").val(text);
}

function isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

function appendSongsByDbResult(db_result, div_dom, header_text) {
    // append new row
    div_dom.append("<div class='score_div score_div_no_bottom'><div class='left_div'></div><div class='right_div'></div></div>");
    // set score text
    div_dom.find(".left_div").last().text(header_text);

    var div_right_dom = div_dom.find(".right_div").last();
    db_result.each(function (entry) {
        // append new div and song
        div_right_dom.append("<div class='elem' data-music-value=\"" + entry.value + " " + entry.type + "\"></div>");
        var elem_dom = div_right_dom.find("div").last();

        var opacity = 0.2;
        if (localStorage.getItem(entry.value + " " + entry.type) == "1") {
            elem_dom.toggleClass("elem_background");
            opacity = 1;
        }

        elem_dom.append("<canvas class='song_img' height='" + (image_size + border_size * 2) + "' width='" + (image_size + border_size * 2) + "'> </canvas>");
        var canvas_dom = elem_dom.find("canvas").last();

        var image_obj = new Image();
        var is_mobile = isMobile();
        image_obj.onload = function () {
            if (is_mobile) {
                canvas_dom.drawImage({
                    source: image_obj,
                    opacity: 1,
                    x: border_size,
                    y: border_size,
                    width: image_size,
                    height: image_size,
                    fromCenter: false,
                    layer: true,
                    name: 'song_img',

                    click: function (layer) {
                        // set up overlap div text
                        var title_name = entry.title;
                        if (entry.type == 3)
                            title_name += " [EXH]";
                        else if (entry.type == 4)
                            title_name += " [INF]";
                        var info_text = "<img src=\"" + "img/" + entry.value + " " + entry.type + ".png" + "\" /><br />";
                        info_text += title_name + "<br />";
                        info_text += "短鍵: " + entry.short_btn + "<br />";
                        info_text += "長短混合: " + entry.short_long_mix + "<br />";
                        info_text += "旋鈕: " + entry.analog + "<br />";
                        info_text += "腦力訓練: " + entry.brain_train + "<br />";
                        info_text += "節奏: " + entry.rythm + "<br />";
                        info_text += "演出陷阱: " + entry.trap + "<br />";
                        $("#song_info_text").html(info_text);
                        // show up overlap div
                        $('#song_info_popup').popup('show');
                    }
                });
            } else {
                canvas_dom.drawImage({
                    source: image_obj,
                    opacity: opacity,
                    x: border_size,
                    y: border_size,
                    width: image_size,
                    height: image_size,
                    fromCenter: false,
                    layer: true,
                    name: 'song_img',

                    mousemove: is_mobile ? null : function (layer) {
                        var title_name = entry.title;
                        if (entry.type == 3)
                            title_name += " [EXH]";
                        else if (entry.type == 4)
                            title_name += " [INF]";
                        $(this).setLayer('song_info', {
                            visible: true,
                            text: title_name + "\n短　　鍵: " + entry.short_btn + "\n長短混合: " + entry.short_long_mix + "\n旋　　鈕: " + entry.analog + "\n腦力訓練: " + entry.brain_train + "\n節　　奏: " + entry.rythm + "\n演出陷阱: " + entry.trap
                        });
                    },
                    mouseout: function (layer) {
                        if (is_mobile == false) {
                            $(this).setLayer('song_info', {
                                visible: false
                            });
                        }
                        clearTimeout(pressTimer);
                    },

                    mousedown: function (layer) {
                        pressTimer = setTimeout(function () {
                            // set up overlap div text
                            var title_name = entry.title;
                            if (entry.type == 3)
                                title_name += " [EXH]";
                            else if (entry.type == 4)
                                title_name += " [INF]";
                            var info_text = "<img src=\"" + "img/" + entry.value + " " + entry.type + ".png" + "\" /><br />";
                            info_text += title_name + "<br />";
                            info_text += "短鍵: " + entry.short_btn + "<br />";
                            info_text += "長短混合: " + entry.short_long_mix + "<br />";
                            info_text += "旋鈕: " + entry.analog + "<br />";
                            info_text += "腦力訓練: " + entry.brain_train + "<br />";
                            info_text += "節奏: " + entry.rythm + "<br />";
                            info_text += "演出陷阱: " + entry.trap + "<br />";
                            $("#song_info_text").html(info_text);
                            // show up overlap div
                            $('#song_info_popup').popup('show');
                        }, 1000);
                    },
                    mouseup: function (layer) {
                        clearTimeout(pressTimer);
                    },

                    click: is_mobile ? null : function (layer) {
                        if (layer.opacity < 1) {
                            $(this).setLayer('song_img', {
                                opacity: 1
                            }).drawLayers();
                        } else {
                            $(this).setLayer('song_img', {
                                opacity: 0.2
                            }).drawLayers();
                        }

                        $(this).parent().toggleClass("elem_background");
                        saveToLocalStorage();
                    }
                });
            }

            canvas_dom.drawText({
                fillStyle: '#9cf',
                x: border_size, y: border_size,
                maxWidth: image_size,
                fromCenter: false,
                fontSize: 14,
                fontFamily: 'Verdana, sans-serif, 微軟正黑體',
                align: 'left',
                layer: true,
                name: 'song_info',
                visible: false
            });
        }
        image_obj.src = "img/" + entry.value + " " + entry.type + ".png";
    });
}

function appendSongsByLevel(level) {
    var div_id = "level" + level;
    var div_dom = $("#" + div_id);
    
    // search the db
    for (var score = 10; score >= -10; --score) {
        var db_result = music_db({ level: level, score: score }).order("title asec");
        if (db_result.count() != 0) {
            appendSongsByDbResult(db_result, div_dom, score);
        }
    }
    // remove last bottom
    div_dom.find(".score_div").last().removeClass("score_div_no_bottom");
}

function appendByScore(score) {
    var div_id = "score" + score;
    var div_dom = $("#" + div_id);
    
    // search the db
    var db_result = music_db({ score: score }).order("title asec");
    if (db_result.count() != 0) {
        appendSongsByDbResult(db_result, div_dom, "");
    }
    // remove last bottom
    div_dom.find(".score_div").last().removeClass("score_div_no_bottom");
}

function b64toBlob(b64_data, content_type, slice_size) {
    content_type = content_type || '';
    slice_size = slice_size || 512;

    var byte_characters = atob(b64_data);
    var byte_arrays = [];

    for (var offset = 0; offset < byte_characters.length; offset += slice_size) {
        var slice = byte_characters.slice(offset, offset + slice_size);

        var byte_numbers = new Array(slice.length);
        for (var i = 0; i < slice.length; i++) {
            byte_numbers[i] = slice.charCodeAt(i);
        }

        var byte_array = new Uint8Array(byte_numbers);

        byte_arrays.push(byte_array);
    }

    var blob = new Blob(byte_arrays, { type: content_type });
    return blob;
}

function downloadAsPng() {
    html2canvas($("#levels")[0], {
        onrendered: function (canvas) {
            var img = canvas.toDataURL("image/png").replace("data:image/png;base64,", "");
            var blob = b64toBlob(img, "imge/png");
            var url = URL.createObjectURL(blob);
            var a = $("#download_png_link")[0];
            a.href = url;
            a.download = "地力表.png";
            a.click();
        }
    });
}

function clearAll() {
    $(".elem").each(function () {
        $(this).removeClass("elem_background");
        $(this).find("canvas").setLayer("song_img", { opacity: 0.2 }).drawLayers();
    });
    // saveToLocalStorage();
    localStorage.clear();
    updateLink();
}

$(document).ready(function () {
    // flush localStorage
    if (localStorage.length == 0) {
        var db_result = music_db();
        db_result.each(function (entry) {
            localStorage.setItem(entry.value + " " + entry.type, "0");
        });
    }

    // get localStorage
    var rec = $.url().param("rec");
    if (rec != undefined) {
        rec = rec.split(",");
        for (var index = 0; index < rec.length; ++index) {
            localStorage.setItem(localStorage.key(index), rec[index]);
        }
        updateLink();
    }

    // append level 15 songs
    appendSongsByLevel(15);
    appendSongsByLevel(16);
    appendByScore(100);
    appendByScore(-100);

    $("#download_as_png").on("click", downloadAsPng);
    $("#clear_all_btn").on("click", clearAll);

    $('#song_info_popup').popup({
        blur: false,
        scrolllock: false,
        transition: 'all 0.3s'
    });
});

function ts() {
    if (this.readOnly) this.checked = this.readOnly = false;
    else if (!this.checked) this.readOnly = this.indeterminate = true;
}