(function(){
    'use strict';

    function mdtRestPaginationHelperFactory(){

        function mdtRestPaginationHelper(tableDataStorageService, paginationSetting, mdtRowPaginatorFunction, mdtRowOptions){
            this.tableDataStorageService = tableDataStorageService;
            this.rowOptions = mdtRowOptions;

            if(paginationSetting &&
                paginationSetting.hasOwnProperty('rowsPerPageValues') &&
                paginationSetting.rowsPerPageValues.length > 0){

                this.rowsPerPageValues = paginationSetting.rowsPerPageValues;
            }else{
                this.rowsPerPageValues = [10,20,30,50,100];
            }

            this.rowsPerPage = this.rowsPerPageValues[0];
            this.page = 1;
            this.totalResultCount = 0;
            this.totalPages = 0;
            this.paginatorFunction = mdtRowPaginatorFunction;
            this.isLoading = false;

            //fetching the 1st page
            this.fetchPage(this.page);
        }

        mdtRestPaginationHelper.prototype.getRows = function(){
            var that = this;

            _.each(this.tableDataStorageService.storage, function (rowData, index) {
                console.log(that.getStartRowIndex(), that.getEndRowIndex(), that.tableDataStorageService.storage.length);
                if(index >= that.getStartRowIndex() && index <= that.getEndRowIndex()) {
                    rowData.optionList.visible = true;
                } else {
                    rowData.optionList.visible = false;
                }
            });

            return this.tableDataStorageService.storage;
        };

        mdtRestPaginationHelper.prototype.getStartRowIndex = function(){
            return (this.page-1) * this.rowsPerPage;
        };

        mdtRestPaginationHelper.prototype.getEndRowIndex = function(){
            return this.getStartRowIndex() + this.rowsPerPage-1;
        };

        mdtRestPaginationHelper.prototype.getTotalRowsCount = function(){
            return this.totalPages;
        };

        mdtRestPaginationHelper.prototype.previousPage = function(){
            if(this.page > 1){
                this.page--;
            }
        };

        mdtRestPaginationHelper.prototype.nextPage = function(){
            var that = this;
            if(this.page < this.totalPages){
                this.fetchPage(this.page+1).then(function(){
                    that.page++;
                });
            }
        };

        mdtRestPaginationHelper.prototype.fetchPage = function(page){
            this.isLoading = true;

            var that = this;

            return this.paginatorFunction({page: page, pageSize: this.rowsPerPage})
                .then(function(data){
                    that.addRawDataToStorage(that, data.results, that.rowOptions['table-row-id-key'], that.rowOptions['column-keys']);
                    that.totalResultCount = data.totalResultCount;
                    that.totalPages = Math.ceil(data.totalResultCount / that.rowsPerPage);
                    that.isLoading = false;

                    that.getRows();
                });
        };

        mdtRestPaginationHelper.prototype.addRawDataToStorage = function(that, data, tableRowIdKey, columnKeys){
            var rowId;
            var columnValues = [];
            _.each(data, function(row){
                rowId = _.get(row, tableRowIdKey);
                columnValues = [];

                _.each(columnKeys, function(columnKey){
                    columnValues.push(_.get(row, columnKey));
                });

                that.tableDataStorageService.addRowData(rowId, columnValues);
            });
        };

        return {
            getInstance: function(tableDataStorageService, isEnabled, paginatorFunction, rowOptions){
                return new mdtRestPaginationHelper(tableDataStorageService, isEnabled, paginatorFunction, rowOptions);
            }
        };
    }

    angular
        .module('mdDataTable')
        .service('mdtRestPaginationHelperFactory', mdtRestPaginationHelperFactory);
}());