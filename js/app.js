jQuery.fn.visible = function() {
    return this.css('visibility', 'visible');
};

jQuery.fn.invisible = function() {
    return this.css('visibility', 'hidden');
};

jQuery.fn.visibilityToggle = function() {
    return this.css('visibility', function(i, visibility) {
        return (visibility == 'visible') ? 'hidden' : 'visible';
    });
};


function onSpinner() {
    let spinner = '<div class="on-load-wrap"><div class="on-load"><div class="spinner"></div></div></div>';
    $('.map-wrap').append(spinner);
}
function offSpinner() {
    $('.on-load-wrap').remove();
}

const app = {

    url: "http://karmap.gamma.interso.ru/",
    api: "local/templates/karmap/ajax/",

    region_id: 0,
    cat_id: 0,

    dd: function () {
        for (let i = 0; i < arguments.length; i++) {
            console.log(arguments[i]);
        }
    },

    apiUrl: function () {
        return this.url + this.api;
    },

    render: function (tpl_selector, params) {
        const tmpl = $.templates(tpl_selector);
        return tmpl.render(params);
    },

    showMiddleBox: function (pr_html) {
        this.dd("showMiddleBox");
        $('.completed-modal__content').html(pr_html);
        app.showCompletedModal(true);
        $('.close-completed-modal').unbind("click").click (function () {
            event.preventDefault();
            app.showCompletedModal(false);
        });
    },

    showCompletedModal: function (show) {
        this.dd("showCompletedModal " + show);
        $('.completed-modal').scrollTop(0);
        if (show) {
            $('.completed-modal').addClass('active');
        } else {
            $('.completed-modal').removeClass('active');
        }
    },

    showRegionsModal: function (show) {
        this.dd("showRegionsModal " + show);
        $('.regions-modal').scrollTop(0);
        if (show) {
            $('.regions-modal').addClass('active');
        } else {
            $('.regions-modal').removeClass('active');
        }
    },

    showCategoryModal: function (show) {
        this.dd("showCategoryModal " + show);
        $('.category-modal').scrollTop(0);
        if (show) {
            $('.category-modal').addClass('active');
        } else {
            $('.category-modal').removeClass('active');
        }
    },

    showProjectModal: function (show) {
        this.dd("showProjectModal " + show);
        $('.project-modal').scrollTop(0);
        if (show) {
            $('.project-modal').addClass('active');
        } else {
            $('.project-modal').removeClass('active');
        }
    },

    showRegionInfo: function (id) {
        this.dd("showRegionInfo id:" + id);
        $('.completed-modal').removeClass('active');
        app.loadRegion(id);
        app.showRegionsModal(false);
    },

    showObjectInfo: function (obj_id) {
        app.dd("showObjectInfo " + obj_id);
        app.loadObjectInfo(obj_id);
    },

    loadObjectInfo: function (obj_id) {
        app.dd("loadObjectInfo obj_id:" + obj_id);
        onSpinner();
        let url = this.apiUrl() + "getObject.php?id=" + obj_id;
        console.log(url);
        $.get(url)
            .done(function (response) {
                response.site = app.url;
                console.log(response);
                const html = app.render("#tpl_object", response);
                $(".project-modal__content").html(html);

                app.showProjectModal(true);
                map.showMarkers([ response.object ]);
                offSpinner();
            })
            .fail(function(jqXHR, textStatus, errorThrown) {
                console.log(jqXHR, textStatus, errorThrown);
                offSpinner();
            }
        );
    },

    loadReleasedObjects: function (region_id, cat_id, realize_status, page) {
        app.dd("loadReleasedObjects region_id:" + region_id + " cat_id:" + cat_id);
        onSpinner();
        let url = this.apiUrl() + "getObjectsList.php?";
        if (region_id) {
            url += "&regionId=" + region_id;
        }
        if (cat_id) {
            url += "&categoryId=" + cat_id;
        }
        if (realize_status) {
            url += "&realizeStatus=" + realize_status;
        }
        if (!page) page = 1;
        url += "&page=" + page;
        this.dd(url);
        $.get(url)
            .done(function (response){
                console.log(response);
                const html = app.render("#tpl_released", response);
                app.showMiddleBox(html);
                app.loadRealizedCount(app.cat_id, ".completed-modal");
                $(".completed-modal .object_link").click(function (){
                    let obj_id = $(this).attr("data-id");
                    app.showObjectInfo(obj_id);
                });
                app.showNavigation(".completed-modal", response.list_navigation, function (page){
                    app.loadReleasedObjects(app.region_id, app.cat_id, realize_status, page);
                    app.loadRealizedCount(app.cat_id, ".completed-modal");
                });
                offSpinner();
            })
            .fail(function(jqXHR, textStatus, errorThrown) {
                console.log(jqXHR, textStatus, errorThrown);
                offSpinner();
            }
        );
    },

    loadRegion: function (region_id) {
        this.dd("loadRegion id:" + region_id);
        onSpinner();
        this.loadObjectsList(region_id);
        const url = this.apiUrl() + "getRegion.php?id=" + region_id;
        this.dd(url);
        $.get(url)
            .done(function (response){
                $(".section_region").fadeIn();
                $(".section_cats").hide();
                response.site = app.url;
                console.log(response)
                map.showRayon(response.region.name);
                const html = app.render("#tpl_region", response);
                $(".section_region").html(html);
                app.loadCategories(region_id, ".section_region .list");
                $(".section_region .get-regions").click(function (){
                    app.showRegionsModal(true);
                });
                $(".section_region .back-btn").click(function () {
                    event.preventDefault();
                    $(".section_cats").fadeIn();
                    $(".section_region").fadeOut();
                    app.showRegionsModal(false);
                    $('.completed-modal').removeClass('active');
                    app.region_id = 0;
                    app.loadObjectsList();
                });
                if (response.region.objects_realized_count)
                $(".section_region .expertise__btn").click(function (){
                    event.preventDefault();
                    const region_id = $(this).attr("data-id");
                    app.loadReleasedObjects(region_id, 0, true);
                });
                offSpinner();
            })
            .fail(function(jqXHR, textStatus, errorThrown) {
                console.log(jqXHR, textStatus, errorThrown);
                offSpinner();
            }
        );
    },

    loadRegions: function () {
        this.dd("loadRegions");
        onSpinner();
        $.get(this.apiUrl() + "getRegionsList.php")
            .done(function (response){
                console.log(response)
                response.site = app.url;
                const html = app.render("#tpl_regions", response);
                $(".regions-modal .list").html(html);
                $(".region_btn").click(function (el){
                    event.preventDefault();
                    const id = $(this).attr("data-id");
                    app.showRegionInfo(id);
                    app.region_id = id;
                });
                offSpinner();
            })
            .fail(function(jqXHR, textStatus, errorThrown) {
                console.log(jqXHR, textStatus, errorThrown);
                offSpinner();
            }
        );
    },

    loadRealizedCount: function (cat_id, container) {
        this.dd("loadRealizedCount cat_id:" + cat_id + " container:" + container);
        const url = this.apiUrl() + "getObjectsList.php?regionId=" + app.region_id + "&categoryId=" + cat_id;
        $.get(url)
            .done(function (response){
                $(container + " .realized").html(response.objects_realized_count);
            })
            .fail(function(jqXHR, textStatus, errorThrown) {
                console.log(jqXHR, textStatus, errorThrown);
            });
    },

    loadCategory: function (cat_id, page) {
        this.dd("loadCategory cat_id:" + cat_id);
        onSpinner();
        const url = this.apiUrl() + "getObjectsList.php?regionId=" + app.region_id + "&categoryId=" + cat_id + "&page=" + page;
        console.log(url);
        $.get(url)
            .done(function (response){
                app.dd(response);
                offSpinner();
                const html = app.render("#tpl_cat_objects", response);
                $(".category-modal__content").html(html);
                $(".category-modal .object_link").click(function () {
                    let obj_id = $(this).attr("data-id");
                    app.showObjectInfo(obj_id);
                });
                if (response.objects_realized_count) {
                    // Кнопка завершенные объекты
                    $(".category-modal .expertise__btn").click(function () {
                        event.preventDefault();
                        app.loadReleasedObjects(app.region_id, cat_id, true);
                    });
                }
                app.loadRealizedCount(cat_id, ".category-modal");
                app.showNavigation(".category-modal", response.list_navigation, function (page){
                    app.loadCategory(app.cat_id, page);
                });
                app.showCompletedModal(false);
            })
            .fail(function(jqXHR, textStatus, errorThrown) {
                console.log(jqXHR, textStatus, errorThrown);
                offSpinner();
            });
        app.showCategoryModal(true);
    },

    showNavigation: function (container, list_navigation, callback) {
        this.dd("showNavigation " + container);
        if (!list_navigation) {
            $(container + " .list-navigation-row").hide();
            return;
        }
        $(container + " .list-navigation-row").show();
        if (list_navigation.prev_page) {
            $(container + " .list-navigation-row .back").visible();
            $(container + " .list-navigation-row .back").unbind('click').click(function (){
                console.log("back", app.cat_id, list_navigation.prev_page);
                event.preventDefault();
                callback(list_navigation.prev_page);
            })
        } else {
            $(container + " .list-navigation-row .back").invisible();
        }
        if (list_navigation.next_page) {
            $(container + " .list-navigation-row .next").visible();
            $(container + " .list-navigation-row .next").unbind('click').click(function (){
                console.log("next", app.cat_id, list_navigation.next_page);
                event.preventDefault();
                callback(list_navigation.next_page);
            })
        } else {
            $(container + " .list-navigation-row .next").invisible();
        }
    },

    loadCategories: function (id, container_selector) {
        this.dd("loadCategories id:" + id + " conteiner:" + container_selector);
        let url = this.apiUrl() + "getCategoriesList.php";
        if (id) {
            url += "?regionId=" + id;
        }
        onSpinner();
        $.get(url)
            .done(function (response){
                app.dd(response);
                response.site = app.url;
                const html = app.render("#tpl_cats", response);
                $(container_selector).html(html);
                $(".category_btn").click(function (){
                    event.preventDefault();
                    const cat_id = $(this).attr("data-id");
                    app.loadCategory(cat_id, 1);
                    app.loadObjectsList(app.region_id, cat_id);
                    app.cat_id = cat_id;
                });
                offSpinner();
            })
            .fail(function(jqXHR, textStatus, errorThrown) {
                console.log(jqXHR, textStatus, errorThrown);
                offSpinner();
            }
        );
    },

    loadObjectsList: function (region_id, cat_id, realize_status) {
        this.dd("loadObjectsList region_id:" + region_id + " cat_id:" + cat_id + " realize_status:" + realize_status);
        let url = this.apiUrl() + "getObjectsList.php?";
        if (region_id) {
            url += "&regionId=" + region_id;
        }
        if (cat_id) {
            url += "&categoryId=" + cat_id;
        }
        if (realize_status) {
            url += "&realizeStatus=" + realize_status;
        }
        onSpinner();
        $.get(url)
            .done(function (response){
                console.log(response);
                map.showMarkers(response.objects_list);
                if (!region_id && !cat_id) {
                    map.showKarelRegion();
                }
                offSpinner();
            })
            .fail(function(jqXHR, textStatus, errorThrown) {
                console.log(jqXHR, textStatus, errorThrown);
                offSpinner();
            }
        );
    },

    init: function () {
        this.dd("init");
        //setTimeout(function (){ onSpinner(); }, 50);
        $(".category-modal .back-btn").click(function () {
            event.preventDefault();
            event.stopPropagation();
            app.showCompletedModal(false);
            app.showCategoryModal(false);
            app.loadObjectsList(app.region_id);
        });
        $(".section_cats .expertise__btn").click(function (){
            event.preventDefault();
            app.cat_id = 0;
            app.loadReleasedObjects(0, 0, true);
        });
        $(".project-modal .back-btn").click(function (){
            app.loadObjectsList(app.region_id, app.cat_id);
            app.showProjectModal(false);
        });
        this.loadRegions();
        this.loadCategories(0, ".section_cats .list");
    }

}

$(function (){
    app.init();
})