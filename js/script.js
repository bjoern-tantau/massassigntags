OC.Plugins.register('OCA.Files.App', {
    attach: function attach(app) {
        app.fileList.fileMultiSelectMenu._scopes.push({
            name: 'addTags',
            displayName: t('massassigntags', 'Add Tags'),
            iconClass: 'icon-tag'
        });
        app.fileList.fileMultiSelectMenu.render();

        var _multiSelectMenuClickAfterMassAssignTags = OCA.Files.FileList.prototype.multiSelectMenuClick;
        OCA.Files.FileList.prototype.multiSelectMenuClick = function multiSelectMenuClick(ev, action) {
            switch (action) {
                case 'addTags':
                    this._onClickAddTagsToSelected(ev);
                    break;
                default:
                    _multiSelectMenuClickAfterMassAssignTags.apply(this, arguments);
                    break;
            }
        }

        function modelToSelection(model) {
            var data = model.toJSON();
            if (!OC.isUserAdmin() && !data.canAssign) {
                data.locked = true;
            }
            return data;
        }

        var MultiFileSystemTagsInfoView = OCA.SystemTags.SystemTagsInfoView.extend({
            _collections: [],

            initialize: function (options) {
                var self = this;
                options = options || {};

                this._inputView = new OC.SystemTags.SystemTagsInputField({
                    multiple: true,
                    allowActions: true,
                    allowCreate: true,
                    isAdmin: OC.isUserAdmin(),
                    initSelection: function (element, callback) {
                        callback(self.selectedTagsCollection.map(modelToSelection));
                    }
                });

                this.selectedTagsCollection = new OC.SystemTags.SystemTagsMappingCollection([], {objectType: 'files'});

                this._inputView.collection.on('change:name', this._onTagRenamedGlobally, this);
                this._inputView.collection.on('remove', this._onTagDeletedGlobally, this);

                this._inputView.on('select', this._onSelectTag, this);
                this._inputView.on('deselect', this._onDeselectTag, this);
                this._collections = [];
            },

            setFiles: function (files) {
                var self = this;
                if (!this._rendered) {
                    this.render();
                }
                files.forEach(function (file) {
                    var collection = new OC.SystemTags.SystemTagsMappingCollection([], {objectType: 'files'});
                    collection.setObjectId(file.id);
                    collection.fetch({
                        success: function (collection) {
                            collection.fetched = true;
                        }
                    });
                    self._collections.push(collection);
                });
            },

            /**
             * Event handler whenever a tag was selected
             */
            _onSelectTag: function (tag) {
                // create a mapping entry for this tag
                this._collections.map(function (collection) {
                    collection.create(tag.toJSON());
                });
            },

            /**
             * Event handler whenever a tag gets deselected.
             * Removes the selected tag from the mapping collection.
             *
             * @param {string} tagId tag id
             */
            _onDeselectTag: function (tagId) {
                this._collections.map(function (collection) {
                    collection.get(tagId).destroy()
                });
            }
        });

        OCA.Files.FileList.prototype._onClickAddTagsToSelected = function _onClickAddTagsToSelected(ev) {
            var files = this.getSelectedFiles();
            var systemTagsInfoView = new MultiFileSystemTagsInfoView();
            systemTagsInfoView.setFiles(files);
            systemTagsInfoView.show();
            OC.dialogs.message('<div id="massassigntagsContainer"></div>', t('massassigntags', 'Add Tags'), 'tag', OC.dialogs.OK_BUTTONS, function () {
                systemTagsInfoView.hide();
                systemTagsInfoView._inputView.remove();
            }, true, true)
                    .then(function () {
                        systemTagsInfoView.$el.appendTo('#massassigntagsContainer');
                        systemTagsInfoView._inputView.$tagsField.select2('dropdown').css('z-index', '10000');
                    });
        }
    }
});