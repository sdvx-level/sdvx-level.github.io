var imageSize = 128;
var borderSize = 6;
var scoreTypeFontSize = 24;

// var phpHost = "http://sdvxlevel.host-ed.me/";
// var phpHost = "http://sdvxlevel.lionfree.net/";
var phpHost = "http://php-sdvxlevel.rhcloud.com/";

// LZW-compress a string
function lzwEncode(s) {
    var dict = {};
    var data = (s + "").split("");
    var out = [];
    var curr_char;
    var phrase = data[0];
    var code = 256;
    var i;
    for (i = 1; i < data.length; i++) {
        curr_char = data[i];
        if (dict[phrase + curr_char] != null) {
            phrase += curr_char;
        }
        else {
            out.push(phrase.length > 1 ? dict[phrase] : phrase.charCodeAt(0));
            dict[phrase + curr_char] = code;
            code++;
            phrase = curr_char;
        }
    }
    out.push(phrase.length > 1 ? dict[phrase] : phrase.charCodeAt(0));
    for (i = 0; i < out.length; i++) {
        out[i] = String.fromCharCode(out[i]);
    }
    return out.join("");
}

// Decompress an LZW-encoded string
function lzwDecode(s) {
    var dict = {};
    var data = (s + "").split("");
    var curr_char = data[0];
    var old_phrase = curr_char;
    var out = [curr_char];
    var code = 256;
    var phrase;
    for (var i = 1; i < data.length; i++) {
        var curr_code = data[i].charCodeAt(0);
        if (curr_code < 256) {
            phrase = data[i];
        }
        else {
            phrase = dict[curr_code] ? dict[curr_code] : (old_phrase + curr_char);
        }
        out.push(phrase);
        curr_char = phrase.charAt(0);
        dict[code] = old_phrase + curr_char;
        code++;
        old_phrase = phrase;
    }
    return out.join("");
}

/**********************************************************
 * Local Storage functions START
 **********************************************************/
function getLocalStorage(key, index) {
    var result = "";
    try {
        result = JSON.parse(localStorage.getItem("rec"))[key][index];
    } catch (err) {
        return "0";
    }
    return result;
}

function setLocalStorage(key, index, value) {
    var original_value = JSON.parse(localStorage.getItem("rec")) || {};
    if (original_value[key] == undefined) original_value[key] = [];
    original_value[key][index] = value;
    localStorage.setItem("rec", JSON.stringify(original_value));
}

song_clear_list = ["", "song_clear_c", "song_clear_hc", "song_clear_uc", "song_clear_puc"];
song_type_list = ["", "B", "A", "AA", "AAA"];

function clearClassToValue(elem) {
    for (var i = 1; i < song_clear_list.length; i++) {
        if (elem.hasClass(song_clear_list[i])) return i;
    }
    return 0;
}

function typeLayerToValue(canvas) {
    for (var i = 0; i < song_type_list.length; i++) {
        if (canvas.getLayer('clear_style').text == song_type_list[i]) return i;
    }
    return 0;
}

function setClearByValue(elem, clear_type) {
    for (var i = 1; i < song_clear_list.length; i++) {
        elem.removeClass(song_clear_list[i]);
    }
    if (clear_type == 0) {
        elem.find("canvas").setLayer("song_img", { opacity: 0.2 }).drawLayers();
    } else {
        elem.find("canvas").setLayer("song_img", { opacity: 1 }).drawLayers();
        elem.addClass(song_clear_list[clear_type]);
    }
}

function setTypeByValue(canvas, score_type) {
    var visible = (score_type != 0);
    canvas.setLayer('clear_style', {
        visible: visible,
        text: song_type_list[score_type]
    }).drawLayers();
}

function saveToLocalStorage() {
    var dict = {};
    $(".elem").each(function() {
        var id = $(this).data("music-id");
        var value = [];
        value[0] = clearClassToValue($(this)).toString();
        value[1] = typeLayerToValue($(this).find("canvas")).toString();
        dict[id] = value;
    });
    localStorage.setItem("rec", JSON.stringify(dict));
}

function loadFromLocalStorage() {
    var dict = JSON.parse(localStorage.getItem("rec"));
    $(".elem").each(function() {
        var id = $(this).data("music-id");
        if (dict[id] == undefined || dict[id] == null) {
            dict[id] = ["0", "0"];
        }
        setClearByValue($(this), dict[id][0]);
        setTypeByValue($(this).find("canvas"), dict[id][1]);
    });
}

function clearAll() {
    $(".elem").each(function () {
        $(this).removeClass("song_clear_c");
        $(this).removeClass("song_clear_hc");
        $(this).removeClass("song_clear_uc");
        $(this).removeClass("song_clear_puc");
        $(this).find("canvas").setLayer("clear_style", {
            visible: false,
            text: ""
        });
        $(this).find("canvas").setLayer("song_img", { opacity: 0.2 }).drawLayers();
    });
    localStorage.removeItem("rec");
    resetLocalStorage();
    updateLink();
}

function resetLocalStorage() {
    var dict = {};
    var db_result = music_db().order("id asec");
    db_result.each(function (entry) {
        dict[entry.id] = ["0", "0"];
    });
    localStorage.setItem("rec", JSON.stringify(dict));
}

/**********************************************************
 * Link functions
 **********************************************************/
function updateLink() {
    var text = "?rec=";
    /*
    for (var i = 0; i < localStorage.length; ++i) {
        text += getLocalStorage(localStorage.key(i), 0) + "," + getLocalStorage(localStorage.key(i), 1) + "|";
    }
    text = text.substring(0, text.length - 1);
    text = $.url().attr("host") + $.url().attr("path") + text;
    */
    var dict = {};
    $(".elem").each(function () {
        var id = $(this).data("music-id");
        var value = [];
        value[0] = clearClassToValue($(this)).toString();
        value[1] = typeLayerToValue($(this).find("canvas")).toString();
        dict[id] = value;
    });
    text += lzwEncode(JSON.stringify(dict));
    text = $.url().attr("host") + $.url().attr("path") + text;
    $("#link").val(text);
}

/**********************************************************
 * Utilities
 **********************************************************/
function isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**********************************************************
 * Element generation functions
 **********************************************************/
function drawSongDataChart(chart_div, table_content, song_title) {
    var data = google.visualization.arrayToDataTable(table_content);

    var options = {
        title: song_title,
        titlePosition: 'in',
        legend: {
            position: "none"
        },
        tooltip: {
        },
        vAxis: {
            minValue: 0,
            maxValue: 11,
            gridlines: {
                count: 12
            }
        },
        fontName: "Consolas, 微軟正黑體",
        hAxis: {
            maxAlternation: 1
        },
        chartArea: {
            width: "90%",
            height: "85%",
            top: "5%"
        }
    };

    var chart = new google.visualization.ColumnChart(chart_div);

    chart.draw(data, options);
}

function zeropad(n, width, z) {
    z = z || '0';
    n = n + '';
    return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

function retrieveCommentInfo(song_id, page, song_comment_div_dom) {
    song_comment_div_dom.html("讀取中...");
    $.post(phpHost + "get_comment.php", {
        "songid": song_id,
        "page": page
    }, function (data) {
        var comments = JSON.parse(data.result);
        var table_dom = $("<table style='width: 100%'></table>");
        for (var index in comments) {
            var date = new Date(comments[index].time);
            var year = date.getFullYear();
            var month = date.getMonth() + 1;
            var day = date.getDate();
            var hour = date.getHours();
            var min = date.getMinutes();
            var sec = date.getSeconds();
            var time = year + "." + zeropad(month, 2) + "." + zeropad(day, 2) + " " + zeropad(hour, 2) + ":" + zeropad(min, 2) + ":" + zeropad(sec, 2);
            table_dom.append(
                "<tr>" +
                    "<th>" + comments[index].user_id + ":</th>" +
                    "<td style='width: 100%'>" + comments[index].comment + "</td>" +
                    "<td style='white-space:nowrap;'>" + time + "</td>" +
                "</tr>"
            );
        }
        song_comment_div_dom.html(table_dom);
    }, "json");
}

function postComment(song_id, username, password, comment, song_comment_send_div_dom, song_comment_div_dom) {
    // disable the button and text
    song_comment_send_div_dom.find(".new_comment_submit").button("disable");
    song_comment_send_div_dom.find(".new_comment_text").prop("disabled", true);

    $.post(phpHost + "post_comment.php", {
        "username": username,
        "password": password,
        "comment": comment,
        "songid": song_id
    }, function (data) {
        console.log(data);
        if (data.status == 0) {
            retrieveCommentInfo(song_id, 0, song_comment_div_dom);
            song_comment_send_div_dom.find(".new_comment_text").val("");
        }
        song_comment_send_div_dom.find(".new_comment_submit").button("enable");
        song_comment_send_div_dom.find(".new_comment_text").prop("disabled", false);
    }, "json");
}

function type_to_string(type, song_id) {
    if (type == 3)
        return "EXH";
    if (type == 4 && song_id < 123)
        return "INF";
    if (type == 4 && song_id >= 123)
        return "GRV";
    return "";
}

function ver_to_string(ver) {
    if (ver == "1")
        return "I";
    if (ver == "2")
        return "II";
    if (ver == "3")
        return "III";
    return "";
}

function appendSongsByDbResult(db_result, div_dom, header_text) {
    // append new row
    div_dom.append("<div class='score_div score_div_no_bottom'><div class='left_div'></div><div class='right_div'></div></div>");
    // set score text
    div_dom.find(".left_div").last().text(header_text);

    var div_right_dom = div_dom.find(".right_div").last();
    db_result.each(function (entry) {
        // append new div and song
        div_right_dom.append("<div class='elem' data-music-id='" + entry.id + "'></div>");
        var elem_dom = div_right_dom.find("div").last();
        var key = entry.id;
        var title_name = entry.title;
        title_name += " [" + type_to_string(entry.type, entry.id) + "]";
        var value = entry.value + " " + entry.type;

        // read localStorage & set opacity
        var opacity = 1;
        var clear_text = "";
        var clear_visible = false;
        switch (getLocalStorage(key, 0)) {
            case "0":
                opacity = 0.2;
                break;
            case "1":
                opacity = 1;
                elem_dom.addClass("song_clear_c");
                break;
            case "2":
                opacity = 1;
                elem_dom.addClass("song_clear_hc");
                break;
            case "3":
                opacity = 1;
                elem_dom.addClass("song_clear_uc");
                break;
            case "4":
                opacity = 1;
                elem_dom.addClass("song_clear_puc");
                break;
        }
        switch (getLocalStorage(key, 1)) {
            case "0":
                clear_text = "";
                clear_visible = false;
                break;
            case "1":
                clear_text = "B";
                clear_visible = true;
                break;
            case "2":
                clear_text = "A";
                clear_visible = true;
                break;
            case "3":
                clear_text = "AA";
                clear_visible = true;
                break;
            case "4":
                clear_text = "AAA";
                clear_visible = true;
                break;
        }

        elem_dom.append("<canvas class='song_img' height='" + (imageSize + borderSize * 2) + "' width='" + (imageSize + borderSize * 2) + "'> </canvas>");
        var canvas_dom = elem_dom.find("canvas").last();

        var image_obj = new Image();
        var is_mobile = isMobile();
        image_obj.onload = function () {
            if (is_mobile) {
                canvas_dom.drawImage({
                    source: image_obj,
                    opacity: 1,
                    x: borderSize,
                    y: borderSize,
                    width: imageSize,
                    height: imageSize,
                    fromCenter: false,
                    layer: true,
                    name: 'song_img',

                    click: function (layer) {
                        // set up overlap div text
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
                    x: borderSize,
                    y: borderSize,
                    width: imageSize,
                    height: imageSize,
                    fromCenter: false,
                    layer: true,
                    name: 'song_img',

                    click: is_mobile ? null : function (layer) {
                        // 根據點燈方式做不同的點燈效果
                        var clear_state;
                        if (layer.event.ctrlKey == true) {
                            // Ctrl + click
                            $("#song_info_dialog").dialog("option", {
                                title: title_name,
                                width: $(window).width() * 0.8,
                                height: $(window).height() * 0.8,
                                maxHeight: $(window).height() * 0.8
                            });

                            var song_img_dom = $("<img />", {
                                src: "img_b/" + value + ".png"
                            });

                            var song_info_table_dom = $("<table class='song_info_table'>" +
                                    "<tr>" +
                                        "<td class='song_info_table_img' rowspan='12'></td>" +
                                        "<th>地力表分數</td>" +
                                        "<td>" + entry.score + "</td>" +
                                    "</tr>" +
                                    "<tr>" +
                                        "<th>歌曲等級</td>" +
                                        "<td>" + entry.level + "</td>" +
                                    "</tr>" +
                                    "<tr>" +
                                        "<th>BPM</td>" +
                                        "<td>" + entry.bpm + "</td>" +
                                    "</tr>" +
                                    "<tr>" +
                                        "<th>Chain</td>" +
                                        "<td>" + entry.chain + "</td>" +
                                    "</tr>" +
                                    "<tr>" +
                                        "<th>Clear rate</td>" +
                                        "<td>" + entry.clear_rate + "</td>" +
                                    "</tr>" +
                                    "<tr>" +
                                        "<th>短鍵</td>" +
                                        "<td>" + entry.short_btn + "</td>" +
                                    "</tr>" +
                                    "<tr>" +
                                        "<th>長短鍵複合</td>" +
                                        "<td>" + entry.short_long_mix + "</td>" +
                                    "</tr>" +
                                    "<tr>" +
                                        "<th>旋鍵複合</td>" +
                                        "<td>" + entry.analog + "</td>" +
                                    "</tr>" +
                                    "<tr>" +
                                        "<th>腦力訓練</td>" +
                                        "<td>" + entry.brain_train + "</td>" +
                                    "</tr>" +
                                    "<tr>" +
                                        "<th>節奏</td>" +
                                        "<td>" + entry.rythm + "</td>" +
                                    "</tr>" +
                                     "<tr>" +
                                        "<th>演出陷阱</td>" +
                                        "<td>" + entry.trap + "</td>" +
                                    "</tr>" +
                                    "<tr>" +
                                        "<th>綜合分數</td>" +
                                        "<td>" + entry.total + "</td>" +
                                    "</tr>" +
                                "</table>");

                            song_info_table_dom.find(".song_info_table_img").append(song_img_dom);

                            var song_div_dom = $("<div />").append(song_info_table_dom);
                            var song_player_dom = loadPlayerAndReturnDom(entry.id);
                            var song_comment_div_dom = $("<div class='song_info_comment_div'></div>");
                            var song_comment_send_div_dom = $("<div class='song_info_comment_send_div'></div>");
                            song_comment_send_div_dom.append("<table class='full_width_table'><tr><td class='full_width_table'><input type='text' class='new_comment_text ui-widget-content ui-corner-all' /></td><td><input type='submit' class='new_comment_submit' value='送出留言'/></td>");
                            song_comment_send_div_dom.find(".new_comment_submit").button().on('click', function () {
                                var comment = song_comment_send_div_dom.find(".new_comment_text").val();
                                if (comment.length > 70) {
                                    $("<div>留言上限為 70 字</div>").dialog({
                                        closeOnEscape: true,
                                        modal: true,
                                        title: "錯誤",
                                        show: { effect: "blind", duration: 200 },
                                        hide: { effect: "blind", duration: 200 }
                                    });
                                } else {
                                    postComment(entry.id, localStorage.getItem("username"), localStorage.getItem("password"), comment, song_comment_send_div_dom, song_comment_div_dom);
                                }
                            });

                            $("#song_info_dialog").html("")
                                .append(song_div_dom)
                                .append(song_player_dom)
                                .append(song_comment_div_dom);
                            if (localStorage.getItem("username") != null) {
                                $("#song_info_dialog").append(song_comment_send_div_dom);
                            }
                            song_div_dom.css("text-align", "center");
                            song_info_table_dom.css("margin", "0 auto");
                            /*
                            song_comment_div_dom.css("text-align", "center");
                            song_comment_table_dom.css("margin", "0 auto");
                            */
                            $("#song_info_dialog").dialog("open");
                            retrieveCommentInfo(entry.id, 0, song_comment_div_dom);

                        } else if (layer.event.shiftKey == false && $("#switch_click").prop("checked") == false) {      // Clear 點燈
                            // get current state by class
                            clear_state = clearClassToValue($(this).parent());
                            // clear_state = getLocalStorage(key, 0);
                            $(this).parent().removeClass("song_clear_c");
                            $(this).parent().removeClass("song_clear_hc");
                            $(this).parent().removeClass("song_clear_uc");
                            $(this).parent().removeClass("song_clear_puc");
                            switch (clear_state) {
                            case 0:
                                $(this).setLayer('song_img', {
                                    opacity: 1
                                }).drawLayers();
                                $(this).parent().addClass("song_clear_c");
                                break;
                            case 1:
                                $(this).setLayer('song_img', {
                                    opacity: 1
                                }).drawLayers();
                                $(this).parent().addClass("song_clear_hc");
                                break;
                            case 2:
                                $(this).setLayer('song_img', {
                                    opacity: 1
                                }).drawLayers();
                                $(this).parent().addClass("song_clear_uc");
                                break;
                            case 3:
                                $(this).setLayer('song_img', {
                                    opacity: 1
                                }).drawLayers();
                                $(this).parent().addClass("song_clear_puc");
                                break;
                            case 4:
                                $(this).setLayer('song_img', {
                                    opacity: 0.2
                                }).drawLayers();
                                break;
                            }
                        } else {    // 分數點燈
                            // get current state
                            clear_state = getLocalStorage(key, 1);
                            switch (clear_state) {
                                case "0":
                                    $(this).setLayer('clear_style', {
                                        visible: true,
                                        text: "B"
                                    }).drawLayers();
                                    setLocalStorage(key, 1, "1");
                                    break;
                                case "1":
                                    $(this).setLayer('clear_style', {
                                        visible: true,
                                        text: "A"
                                    }).drawLayers();
                                    setLocalStorage(key, 1, "2");
                                    break;
                                case "2":
                                    $(this).setLayer('clear_style', {
                                        visible: true,
                                        text: "AA"
                                    }).drawLayers();
                                    setLocalStorage(key, 1, "3");
                                    break;
                                case "3":
                                    $(this).setLayer('clear_style', {
                                        visible: true,
                                        text: "AAA"
                                    }).drawLayers();
                                    setLocalStorage(key, 1, "4");
                                    break;
                                case "4":
                                    $(this).setLayer('clear_style', {
                                        visible: false
                                    }).drawLayers();
                                    setLocalStorage(key, 1, "0");
                                    break;
                            }
                        }

                        updateLink();
                    }
                });
            }

            canvas_dom.drawText({
                fillStyle: 'rgb(255,255,0)',
                strokeStyle: 'rgb(0,0,255)',
                fontStyle: 'bold',
                strokeWidth: 1,
                x: borderSize + imageSize - 2,
                y: borderSize + 2 + scoreTypeFontSize / 3,
                // x: borderSize + imageSize/2, y: borderSize + imageSize/2,
                // fromCenter: true,
                fontSize: scoreTypeFontSize,
                fontFamily: 'Consolas, Verdana, sans-serif, 微軟正黑體',
                align: 'right',
                respectAlign: true,
                layer: true,
                name: 'clear_style',
                visible: clear_visible,
                text: clear_text
            });

            canvas_dom.drawText({
                fillStyle: 'rgb(255,255,0)',
                strokeStyle: 'rgb(0,0,255)',
                fontStyle: 'bold',
                strokeWidth: 1,
                x: borderSize + 2,
                y: borderSize + 2 + scoreTypeFontSize / 3,
                // x: borderSize + imageSize/2, y: borderSize + imageSize/2,
                // fromCenter: true,
                fontSize: 18,
                fontFamily: 'sans-serif, 微軟正黑體',
                align: 'left',
                respectAlign: true,
                layer: true,
                name: 'song_ver',
                text: ver_to_string(entry.ver)
            })
        }
        image_obj.src = "img/" + value + ".png";
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

/**********************************************************
 * Pictures Download & Upload
 **********************************************************/
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

function extractToken(hash) {
    var match = hash.match(/access_token=(\w+)/);
    return !!match && match[1];
};

function uploadToImgur() {
    html2canvas($("#levels")[0], {
        onrendered: function (canvas) {
            var extra_canvas = document.createElement("canvas");
            var extra_width = canvas.width / 2;
            var extra_height = canvas.height / 2;
            extra_canvas.setAttribute('width', extra_width);
            extra_canvas.setAttribute('height', extra_height);
            var ctx = extra_canvas.getContext('2d');
            ctx.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, extra_width, extra_height);
            var img = extra_canvas.toDataURL("image/png").replace("data:image/png;base64,", "");
            sessionStorage.doUpload = true;
            sessionStorage.imageBase64 = img;
            // testing used
            // window.location = "https://api.imgur.com/oauth2/authorize?response_type=token&client_id=50df2d703759afd";
            // publish used
            window.location = "https://api.imgur.com/oauth2/authorize?response_type=token&client_id=ee6a02964edbb05";
        }
    });
}
/**********************************************************
 * Customize function
 **********************************************************/
function resetSongs() {
    $(".score_div").remove();
    appendSongsByLevel(15);
    appendSongsByLevel(16);
    appendByScore(100);
    appendByScore(-100);
}

function openCustomize() {
    $("#customize_dialog").dialog("open");
}

/**********************************************************
 * Account function
 **********************************************************/
function saveToAccount() {
    $("#save_load_dialog").html("儲存中...");
    $("#save_load_dialog").dialog("open");
    var dict = {};
    $(".elem").each(function () {
        var id = $(this).data("music-id");
        var value = [];
        value[0] = clearClassToValue($(this)).toString();
        value[1] = typeLayerToValue($(this).find("canvas")).toString();
        dict[id] = value;
    });
    var rec = JSON.stringify(dict);
    var username = localStorage.getItem("username");
    var password = localStorage.getItem("password");

    $.post(phpHost + "put_rec.php", {
        "username": username,
        "password": password,
        "rec": rec
    }, function (data) {
        if (data.status == 0) {
        } else  {
        }
        $("#save_load_dialog").dialog("close");
    }, "json");
}

function loadFromAccount() {
    $("#save_load_dialog").html("讀取中...");
    $("#save_load_dialog").dialog("open");
    var username = localStorage.getItem("username");
    var password = localStorage.getItem("password");
    $.post(phpHost + "get_rec.php", {
        "username": username,
        "password": password
    }, function (data) {
        if (data.status == 0) {
            var dict = JSON.parse(data.rec);
            $(".elem").each(function () {
                var id = $(this).data("music-id");
                if (dict[id] == undefined || dict[id] == null) {
                    dict[id] = ["0", "0"];
                }
                setClearByValue($(this), dict[id][0]);
                setTypeByValue($(this).find("canvas"), dict[id][1]);
            });
        } else {
        }
        $("#save_load_dialog").dialog("close");
    }, "json");
}

function logout() {
    localStorage.removeItem("username");
    localStorage.removeItem("password");
    $("#login").show();
    $("#logout").hide();
    $("#vote").hide();
    $("#signup").show();
    $("#save_to_account").hide();
    $("#load_from_account").hide();
    not_logged_info();
}

function login_success(username) {
    $("#login_status").html("歡迎 " + username + " 登入");
    $("#login").hide();
    $("#logout").show();
    $("#signup").hide();
    $("#vote").show();
    $("#save_to_account").show();
    $("#load_from_account").show();
}

function login() {
    var valid = true;
    var username_dom = $("#login_username");
    var password_dom = $("#login_password");
    var all_fields = $([]).add(username_dom).add(password_dom);
    all_fields.removeClass("ui-state-error");

    valid = valid && checkLength(username_dom, "username", 3, 16);
    valid = valid && checkLength(password_dom, "password", 5, 16);

    valid = valid && checkRegexp(username_dom, /^([0-9a-zA-Z_])+$/i, "帳號必須由 0-9, a-z, A-Z 和底線組成，長度在 3 ~ 16 字元之間");
    valid = valid && checkRegexp(password_dom, /^([0-9a-zA-Z_])+$/, "密碼必須由 0-9, a-z, A-Z 和底線組成，長度在 5 ~ 16 字元之間");

    var username = username_dom.val();
    var password = password_dom.val();

    if (valid) {
        $.post(phpHost + "login.php", {
            "username": username,
            "password": password
        }, function (data) {
            if (data.status == 0) {
                // 成功登入
                login_success(username);
                localStorage.setItem("username", username);
                localStorage.setItem("password", password);
                $("#login_dialog").dialog("close");
            } else if (data.status == -1) {
                username_dom.addClass("ui-state-error");
                updateTips("帳號不存在");
            } else if (data.status == -2) {
                password_dom.addClass("ui-state-error");
                updateTips("密碼錯誤");
            } else if (data.status == -3) {
                username_dom.addClass("ui-state-error");
                updateTips("帳號格式錯誤");
            } else if (data.status == -4) {
                password_dom.addClass("ui-state-error");
                updateTips("密碼格式錯誤");
            } else {
                updateTips("不知名的錯誤");
            }
        }, "json");
    }
    return valid;
}

function signup() {
    var valid = true;
    var username_dom = $("#signup_username");
    var password_dom = $("#signup_password");
    var all_fields = $([]).add(username_dom).add(password_dom);
    all_fields.removeClass("ui-state-error");

    valid = valid && checkLength(username_dom, "username", 3, 16);
    valid = valid && checkLength(password_dom, "password", 5, 16);

    valid = valid && checkRegexp(username_dom, /^([0-9a-zA-Z_])+$/i, "帳號必須由 0-9, a-z, A-Z 和底線組成，長度在 3 ~ 16 字元之間");
    valid = valid && checkRegexp(password_dom, /^([0-9a-zA-Z_])+$/, "密碼必須由 0-9, a-z, A-Z 和底線組成，長度在 5 ~ 16 字元之間");

    if (valid) {
        $.post(phpHost + "signup.php", {
            "username": username_dom.val(),
            "password": password_dom.val()
        }, function (data) {
            if (data.status == 0) {
                $("#signup_dialog").dialog("close");
            } else if (data.status == -1) {
                username_dom.addClass("ui-state-error");
                updateTips("帳號已經被使用");
            } else if (data.status == -2) {
                username_dom.addClass("ui-state-error");
                updateTips("帳號格式不合法");
            } else if (data.status == -3) {
                password_dom.addClass("ui-state-error");
                updateTips("密碼格式不合法");
            } else {
                updateTips("不知名的錯誤");
            }
        }, "json");
    }
    return valid;
}

function not_logged_info() {
    // not logged in
    $("#logout").hide();
    $("#vote").hide();
    $("#login_status").html("尚未登入");
}

function updateTips(t) {
    var tips = $(".validateTips");
    tips
      .text(t)
      .addClass("ui-state-highlight");
    setTimeout(function () {
        tips.removeClass("ui-state-highlight", 1500);
    }, 500);
}

function checkLength(o, n, min, max) {
    if (o.val().length > max || o.val().length < min) {
        o.addClass("ui-state-error");
        updateTips("欄位 " + n + " 長度必須介於 " +
          min + " 和 " + max + " 之間");
        return false;
    } else {
        return true;
    }
}

function checkRegexp(o, regexp, n) {
    if (!(regexp.test(o.val()))) {
        o.addClass("ui-state-error");
        updateTips(n);
        return false;
    } else {
        return true;
    }
}

function init_account() {
    $("#login").button();
    $("#logout").button().hide().on("click", logout);
    $("#signup").button();
    $("#vote").button().hide().on("click", function () { window.location = "vote.html"; });
    $("#save_to_account").button().hide().on("click", saveToAccount);
    $("#load_from_account").button().hide().on("click", loadFromAccount);

    if (localStorage.getItem("username") != null && localStorage.getItem("password") != null) {
        // try to login
        $("#login_status").html("登入中...");
        $.post(phpHost + "login.php", {
            "username": localStorage.getItem("username"),
            "password": localStorage.getItem("password")
        }, function (data) {
            if (data.status == 0) {
                // 登入成功
                login_success(localStorage.getItem("username"));
            } else {
                // 登入失敗
                not_logged_info();
            }
        }, "json");
    } else {
        not_logged_info();
    }

    // signup dialog
    var all_fields = $([]).add($("#signup_username")).add($("#signup_password"));
    var signup_dialog = $("#signup_dialog").dialog({
        autoOpen: false,
        height: 400,
        width: 600,
        modal: true,
        buttons: {
            "創新帳號": signup,
            "取消": function () {
                signup_dialog.dialog("close");
            }
        },
        close: function () {
            signup_dialog.find("form")[0].reset();
            all_fields.removeClass("ui-state-error");
        },
        show: { effect: "blind", duration: 500 },
        hide: { effect: "blind", duration: 500 }
    });
    signup_dialog.find("form").on("submit", function (event) {
        event.preventDefault();
        signup();
    });
    $("#signup").button().on("click", function () {
        signup_dialog.dialog("open");
    });

    // login dialog
    var login_all_fields = $([]).add($("#login_username")).add($("#login_password"));
    var login_dialog = $("#login_dialog").dialog({
        autoOpen: false,
        height: 400,
        width: 600,
        modal: true,
        buttons: {
            "登入": login,
            "取消": function () {
                login_dialog.dialog("close");
            }
        },
        close: function () {
            login_dialog.find("form")[0].reset();
            login_all_fields.removeClass("ui-state-error");
        },
        show: { effect: "blind", duration: 500 },
        hide: { effect: "blind", duration: 500 }
    });
    login_dialog.find("form").on("submit", function (event) {
        event.preventDefault();
        login();
    });
    $("#login").button().on("click", function () {
        login_dialog.dialog("open");
    });

    // Save/Load dialog
    var save_load_dialog = $("#save_load_dialog").dialog({
        autoOpen: false,
        height: 300,
        width: 300,
        modal: true,
        show: { effect: "blind", duration: 500 },
        hide: { effect: "blind", duration: 500 }
    });
}

/**********************************************************
 * Load from http://sdvx-s.coresv.com/
 **********************************************************/
function getValueFromSongType(song_type) {
    switch (song_type) {
        case "novice":
            return 1;
        case "advanced":
            return 2;
        case "exhaust":
            return 3;
        case "infinite":
            return 4;
        default:
            return 0;
    }
}

function loadFromSDVXScore() {
    var username = prompt("請輸入 sdvx-s 的 user name", "sample");
    if (username == null)
        return;

    $("#save_load_dialog").html("讀取中...");
    $("#save_load_dialog").dialog("open");

    $.getJSON("http://sdvx-s.coresv.com/user/" + username + ".json?callback=?")
        .done(function (data) {
            var tracks = data.profile.tracks;
            for (var track_index in tracks) {
                var track = tracks[track_index];
                var track_title = track.title;
                // parse &amp; to &
                var div = document.createElement('div');
                div.innerHTML = track_title;
                track_title = div.firstChild.nodeValue;
                // trim "(EXIT TUNES)" from end of the song title
                var track_title_trim_index = track_title.lastIndexOf("(EXIT TUNES)");
                if (track_title_trim_index != -1) {
                    track_title = track_title.substring(0, track_title_trim_index);
                }
                for (var info_index in track) {
                    var info = track[info_index];
                    var song_type = getValueFromSongType(info_index);
                    if (song_type == 0)
                        continue;

                    // find elem of this song
                    var db_result = music_db({ title: track_title, type: song_type });
                    if (db_result.count() == 0)
                        continue;

                    var song_id = db_result.first().id;
                    var elem = $(".elem[data-music-id=" + song_id.toString() + "]");
                    
                    // info.grade
                    // b, a, aa, aaa
                    switch (info.grade) {
                        case "b":
                            setTypeByValue(elem.find("canvas"), 1);
                            break;
                        case "a":
                            setTypeByValue(elem.find("canvas"), 2);
                            break;
                        case "aa":
                            setTypeByValue(elem.find("canvas"), 3);
                            break;
                        case "aaa":
                            setTypeByValue(elem.find("canvas"), 4);
                            break;
                        default:
                            setTypeByValue(elem.find("canvas"), 0);
                            break;
                    }

                    // info.medal
                    // crash, comp, excessive, uc, per
                    switch (info.medal) {
                        case "crash":
                            setClearByValue(elem, 0);
                            break;
                        case "comp":
                            setClearByValue(elem, 1);
                            break;
                        case "excessive":
                            setClearByValue(elem, 2);
                            break;
                        case "uc":
                            setClearByValue(elem, 3);
                            break;
                        case "per":
                            setClearByValue(elem, 4);
                            break;
                        default:
                            setClearByValue(elem, 0);
                            break;
                    }
                }
            }
        })
        .fail(function (e) {
            return;
        })
        .always(function() {
            $("#save_load_dialog").dialog("close");
        });
}

/**********************************************************
 * Youtube API function
 **********************************************************/
var YoutubeApiLoadDone = false;

function onYouTubeIframeAPIReady() {
    YoutubeApiLoadDone = true;
}

function gotoAndPlay(player, second, length) {
    if (player.getPlayerState() != YT.PlayerState.PLAYING) {
        player.playVideo();
    }
    player.seekTo(second);
    if (length != null) {
        setTimeout(function() {
            stopVideo(player);
        }, length * 1000);
    }
}

function stopVideo(player) {
    player.stopVideo();
}

function loadPlayerAndReturnDom(music_id) {
    var div = $("<div />");
    div.load("./info/" + music_id + ".html");
    return div;
}

/**********************************************************
 * Document ready function
 **********************************************************/
$(document).ready(function () {
    // flush localStorage
    if (localStorage.length == 0) {
        resetLocalStorage();
    }

    // 更新 settings
    if (localStorage.getItem("imageSize") != undefined)
        imageSize = parseInt(localStorage.getItem("imageSize"));
    if (localStorage.getItem("borderSize") != undefined)
        borderSize = parseInt(localStorage.getItem("borderSize"));
    if (localStorage.getItem("score_type_font_size") != undefined)
        scoreTypeFontSize = parseInt(localStorage.getItem("score_type_font_size"));

    // get localStorage
    var rec = $.url().param("rec");
    if (rec != undefined) {
        var parsed_rec = lzwDecode(rec);
        localStorage.setItem("rec", parsed_rec);
    }

    // append level 15 songs
    appendSongsByLevel(15);
    appendSongsByLevel(16);
    appendByScore(100);
    appendByScore(-100);

    $("#save_to_browser").button().on("click", saveToLocalStorage);
    $("#load_from_browser").button().on("click", loadFromLocalStorage);
    $("#load_from_sdvx_score").button().on("click", loadFromSDVXScore);
    $("#generate_link").button().on("click", updateLink);

    $("#download_as_png").button().on("click", downloadAsPng);
    $("#clear_all_btn").button().on("click", clearAll);
    $("#upload_to_imgur").button().on("click", uploadToImgur);

    $("#customize").button().on("click", openCustomize);

    $('#song_info_popup').popup({
        blur: false,
        scrolllock: false,
        transition: 'all 0.3s'
    });

    // 檢查 upload to imgur 是否被 trigger
    var token = extractToken(document.location.hash);
    if (token && JSON.parse(sessionStorage.doUpload)) {
        sessionStorage.doUpload = false;
        $("#levels").hide();
        $("#upload_info").show();

        $.ajax({
            url: 'https://api.imgur.com/3/image',
            method: 'POST',
            headers: {
                Authorization: 'Bearer ' + token,
                Accept: 'application/json'
            },
            data: {
                image: sessionStorage.imageBase64,
                type: 'base64'
            },
            xhr: function () {
                var xhr = new window.XMLHttpRequest();
                //Upload progress
                xhr.upload.addEventListener("progress", function (evt) {
                    if (evt.lengthComputable) {
                        var percent_complete = evt.loaded / evt.total;
                        //Do something with upload progress
                        $("#upload_percent").text((percent_complete * 100).toFixed(2) + "%");
                    }
                }, false);
                return xhr;
            },
            success: function (result) {
                var id = result.data.id;
                window.location = 'https://imgur.com/gallery/' + id;
            }
        });
    }

    var window_width = $(window).width();
    var window_height = $(window).height();
    $("#tabs").tabs();
    $("#updates_accordion").accordion({
        heightStyle: "content"
    });
    // 跳出 infomation 視窗
    $("#information").dialog({
        closeOnEscape: true,
        draggable: false,
        modal: true,
        width: window_width * 0.8,
        height: window_height * 0.8,
        maxHeight: window_height * 0.8,
        title: "Information",
        position: { my: "center top", at: "center top+10%", of: window },
        close: function(event, ui) { $('#wrap').show(); $("body").removeClass("no_scroll"); },
        open: function(event, ui) { $('.ui-widget-overlay').bind('click', function(){ $("#information").dialog('close'); }); $("body").addClass("no_scroll"); },
        show: { effect: "blind", duration: 500 },
        hide: { effect: "blind", duration: 500 }
    });
    // 設定 setting dialog
    var score_style_font_size_spinner = $("#score_style_font_size").spinner();
    score_style_font_size_spinner.spinner("value", scoreTypeFontSize);
    var image_size_spinner = $("#image_size").spinner();
    image_size_spinner.spinner("value", imageSize);
    var border_size_spinner = $("#border_size").spinner();
    border_size_spinner.spinner("value", borderSize);
    $("#customize_dialog").dialog({
        autoOpen: false,
        closeOnEscape: true,
        draggable: false,
        modal: true,
        width: window_width * 0.8,
        height: window_height * 0.8,
        maxHeight: window_height * 0.8,
        title: "Options",
        position: { my: "center top", at: "center top+10%", of: window },
        buttons: {
            "儲存": function () {
                var font_size = score_style_font_size_spinner.spinner("value");
                localStorage.setItem("score_type_font_size", font_size);
                scoreTypeFontSize = font_size;
                var image_size = image_size_spinner.spinner("value");
                localStorage.setItem("imageSize", image_size);
                imageSize = image_size;
                var border_size = border_size_spinner.spinner("value");
                localStorage.setItem("border_size", border_size);
                borderSize = border_size;

                resetSongs();
                $(this).dialog("close");
            },
            "回到預設": function () {
                score_style_font_size_spinner.spinner("value", 24);
                image_size_spinner.spinner("value", 128);
                border_size_spinner.spinner("value", 6);
            },
            "取消": function () {
                $(this).dialog("close");
            }
        },
        close: function (event, ui) {
            $('#wrap').show(); $("body").removeClass("no_scroll");
        },
        open: function (event, ui) { $('.ui-widget-overlay').bind('click', function () { $("#customize_dialog").dialog('close'); }); $("body").addClass("no_scroll"); },
        show: { effect: "blind", duration: 500 },
        hide: { effect: "blind", duration: 500 }
    });
    // 設定歌曲資料 dialog
    $("#song_info_dialog").dialog({
        autoOpen: false,
        closeOnEscape: true,
        draggable: false,
        modal: true,
        width: window_width * 0.8,
        height: window_height * 0.8,
        maxHeight: window_height * 0.8,
        title: "Song info",
        position: { my: "center top", at: "center top+10%", of: window },
        close: function (event, ui) {
            $('#wrap').show(); $("body").removeClass("no_scroll");
        },
        open: function (event, ui) { $('.ui-widget-overlay').bind('click', function () { $("#song_info_dialog").dialog('close'); }); $("body").addClass("no_scroll"); },
        show: { effect: "blind", duration: 500 },
        hide: { effect: "blind", duration: 500 }
    });

    init_account();

    $(document).tooltip({
        items: ".elem, #light_type",
        content: function () {
            var element = $(this);
            if (element.is("#light_type")) {
                return element.attr("title");
            }
            if (element.is(".elem")) {
                return '<div id="chart_div" data-music-id="' + element.data("music-id") + '" style="width: 512px; height: 288px;"></div>';
            }
            return "";
        },
        close: function () {
            $(".ui-helper-hidden-accessible").remove();
        },
        open: function (event, ui) {
            var music_id = ui.tooltip.find("#chart_div").data("music-id");
            var song_info_row = music_db({ id: music_id }).first();
            if (song_info_row) {
                var song_info = [
                    ["種類", "分數"]
                ];
                song_info.push(["短鍵", song_info_row.short_btn]);
                song_info.push(["長短鍵複合", song_info_row.short_long_mix]);
                song_info.push(["旋鍵複合", song_info_row.analog]);
                song_info.push(["腦力訓練", song_info_row.brain_train]);
                song_info.push(["節奏", song_info_row.rythm]);
                song_info.push(["演出陷阱", song_info_row.trap]);

                var title_name = song_info_row.title;
                title_name += " [" + type_to_string(song_info_row.type, music_id) + "]";

                drawSongDataChart(ui.tooltip.find("#chart_div")[0], song_info, title_name);
            }
        }
    });

    // load youtube script
    var tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    var first_script_tag = document.getElementsByTagName('script')[0];
    first_script_tag.parentNode.insertBefore(tag, first_script_tag);
});