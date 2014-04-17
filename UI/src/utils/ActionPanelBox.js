window.AssetActionPanel = function(identifier, header, isExpanded, icon) {
    var readOnly = false;

    _.templateSettings = {
                interpolate: /\{\{(.+?)\}\}/g
    };

    var layerGroup =jQuery(
        '<div class="actionPanel ' + identifier + '">' +
            '<div class="layerGroup">' +
                '<div class="layerGroupImg_'+identifier+' layerGroupImg_unselected_'+identifier+'"></div>' +
                '<div class="layerGroupLabel">'+header+'</div>' +
            '</div>' +
            '<div class="layerGroupLayers"></div>' +
        '</div>');

    var actionButtons = jQuery(
        '<div class="actionButtons readOnlyModeHidden">' +
            '<div data-action="Select" class="actionButton actionButtonActive actionPanelButtonSelect">' +
            '<div class="actionPanelButtonSelectImage actionPanelButtonSelectActiveImage"></div>' +
            '</div>' +
            '<div data-action="Add" class="actionButton actionPanelButtonAdd">' +
            '<div class="actionPanelButtonAddImage"></div>' +
            '</div>' +
            '</div>');


    var editMessage = '<div class="editMessage readOnlyModeHidden">Muokkaustila: muutokset tallentuvat automaattisesti</div>';
    var cursor = {'Select' : 'default', 'Add' : 'crosshair', 'Remove' : 'no-drop'};

    var handleAssetModified = function(asset) {
        eventbus.trigger('validityPeriod:changed', selectedValidityPeriods);
    };

    var render =  function() {
        renderView();
        bindEvents();
    };

    var selectedValidityPeriods = [];
    var prepareLayerSelection = function(layer) {
        var mapBusStopLayer = _.template(
            '<div class="busStopLayer">' +
                '<div class="busStopLayerCheckbox"><input type="checkbox" {{selected}} /></div>' +
                '{{name}}' +
            '</div>');
        var layerSelection = $(mapBusStopLayer({ selected: layer.selected ? "checked" : "", name: layer.label}));

        if (layer.selected) {
            selectedValidityPeriods.push(layer.id);
        }
        layerSelection.find(':input').change(function (target) {
            if (target.currentTarget.checked) {
                selectedValidityPeriods.push(layer.id);
            } else {
                selectedValidityPeriods = _.without(selectedValidityPeriods, layer.id);
            }
            eventbus.trigger('validityPeriod:changed', selectedValidityPeriods);
        });
        return layerSelection;
    };

    var button = $('<button class="editMode actionModeButton"></button>');
    var editButtonForGroup = function() {
        var editMode = function () {
            readOnly = false;
            showEditMode();
            // actionButtons.show();
            button.off().click(readMode);
        };
        var readMode = function () {
            readOnly = true;
            hideEditMode();
            // actionButtons.hide();
            button.off().click(editMode);
        };

        return button.text('Siirry muokkaustilaan').click(editMode);
    };

    var renderView = function() {
        jQuery(".panelLayerGroup").append(layerGroup);

        var layerPeriods = [
            {id: "current", label: "Voimassaolevat", selected: true},
            {id: "future", label: "Tulevat"},
            {id: "past", label: "Käytöstä poistuneet"}
        ];
        _.forEach(layerPeriods, function (layer) {
            layerGroup.find(".layerGroupLayers").append(prepareLayerSelection(layer));
        });

        $.get("/api/user/roles", function(data) {
            if(_.contains(data, "viewer") === false){
                layerGroup.append(editButtonForGroup());
            }
        });
        jQuery(".container").append(editMessage);
    };

    var bindEvents =  function() {
        jQuery(".panelControl").on("click", function() {
            togglePanel();
        });

        jQuery(".actionButton").on("click", function() {
            var data = jQuery(this);
            var action = data.attr('data-action');
            changeTool(action);
        });

        layerGroup.find('.layerGroup').on('click', function() {
            isExpanded = true;
            eventbus.trigger('layer:selected',identifier);
        });
    };

    var changeTool = function(action) {
        jQuery(".actionButtonActive").removeClass("actionButtonActive");
        jQuery(".actionPanelButton"+action).addClass("actionButtonActive");
        jQuery(".actionPanelButtonSelectActiveImage").removeClass("actionPanelButtonSelectActiveImage");
        jQuery(".actionPanelButtonAddActiveImage").removeClass("actionPanelButtonAddActiveImage");
        jQuery(".olMap").css('cursor', cursor[action]);
        eventbus.trigger('tool:changed', action);
    };

    var togglePanel = function() {
        jQuery(".actionPanel").toggleClass('actionPanelClosed');
    };

    var hideEditMode = function() {

        // actions piiloon
        // värit tummix
        // message poist TODO: refactor message pois tästä

        // TODO: remove this?
        eventbus.trigger('asset:unselected');
        eventbus.trigger('application:readOnly', readOnly);

        changeTool('Select');


        button.removeClass('readOnlyMode').addClass('editMode').text('Siirry muokkaustilaan');

        actionButtons.hide();
        layerGroup.find('.layerGroup').removeClass('layerGroupSelectedMode');
        layerGroup.find('.layerGroup').removeClass('layerGroupEditMode');
        jQuery('.editMessage').addClass('readOnlyModeHidden');
    };

    var showEditMode = function() {
        // actions buttons näkyviin
        // värit sinisix
        // message näkyviin TODO: refactor message pois tästä

        // TODO: remove this?
        eventbus.trigger('asset:unselected');
        eventbus.trigger('application:readOnly', readOnly);

        changeTool('Select');

        actionButtons.show();
        button.removeClass('editMode').addClass('readOnlyMode').text('Siirry katselutilaan');

        layerGroup.find('.layerGroup').addClass('layerGroupSelectedMode');
        layerGroup.find('.layerGroup').addClass('layerGroupEditMode');
        jQuery('.editMessage').removeClass('readOnlyModeHidden');
    };

    var handleGroupSelect = function(id) {

        if(identifier === id) {
            layerGroup.find('.layerGroupLayers').removeClass('readOnlyModeHidden');
            layerGroup.find('.layerGroupImg_unselected_'+id).addClass('layerGroupImg_selected_'+id);
            button.show();
            hideEditMode();
            layerGroup.find('.layerGroup').addClass('layerGroupSelectedMode');
        } else {
            isExpanded = false;
            readOnly = true;
            layerGroup.find('.layerGroupLayers').addClass('readOnlyModeHidden');
            layerGroup.find('.layerGroupImg_selected_'+identifier).removeClass('layerGroupImg_selected_'+identifier);
            button.hide();
            hideEditMode();
        }
    };

    eventbus.on('asset:fetched assetPropertyValue:fetched asset:created', handleAssetModified, this);
    eventbus.on('layer:selected', handleGroupSelect, this);

    render();
};