/**
 * Created with JetBrains WebStorm.
 * User: @siwenwen
 * Date: 13-10-2
 * Time: ����11:40
 */
define([], function(){
    'use strict';

    return ['$scope', 'auth', 'action', 'privilege', '$location', '$routeParams', 'userGroup', 'userGroupPrivilege', '$modal', '$q', '$filter', function($scope, Auth, Action, Privilege, $location, $routeParams, UserGroup, UserGroupPrivilege, $modal, $q, $filter){
        Auth.isLogined();

        var page = $routeParams.page - 1;
        $scope.gid = $routeParams.gid;
        $scope.resetFlag = false;
        $scope.hasManyData = true;
        $scope.isLoading = true;
        $scope.data = [];

        Action.link('privilegeUserGroupEdit', 'privilege').success(function(response){
            $scope.switchFlag = response.status;
        });

        //��ȡ�û�����Ϣ
        $scope.group={};
        UserGroup.get({gid: $routeParams.gid, uid: 0}).$promise.then(function(response){
            response.name = decodeURI(response.name);
            response.info = decodeURI(response.info);
            response.parentName = decodeURI(response.parentName);
            $scope.group= response;
        });

        //��ȡ���������
        $scope.downloadData = function(){
            $scope.isLoading = true;

            UserGroupPrivilege.query({page: ++page, gid: $routeParams.gid}).$promise.then(function(response){

                angular.forEach(response.items, function(item){
                    item.privName = decodeURI(item.privName);
                    item.app = decodeURI(item.app);
                    item.info = decodeURI(item.info);
                    if(item.begin == -1){
                        item.begin = '������';
                    }else{
                        item.begin = Date.parse(item.begin);
                    }
                    if(item.end == -1){
                        item.end = '������';
                    }else{
                        item.end = Date.parse(item.end);
                    }

                    $scope.data.push(item);
                });

                if(!response.hasMore){
                    $scope.hasManyData = false;
                }

                $scope.isLoading = false;
            });
        };

        //���ý�������������ɸѡ��������������
        $scope.resetFilter = function(){
            $scope.status = '';
            $scope.searchText = '';
            $scope.predicate = '';
            $scope.reverse = false;

            $scope.resetFlag = 0;
        };

        //������Ч��
        $scope.changeValidity = function(index, status){

            var promise = UserGroupPrivilege.changStatus({pid: $scope.data[index].privId, status: status, gid: $routeParams.gid}).$promise;
            promise.then(function(response){
                if(response['status'] == 0){

                    //�޸Ĵ�����ʾ
                    angular.element.gritter.add({
                        title: '��ʾ'
                        , text: 'Ȩ�޵���Ч�Ը���ʧ��!'
                        , class_name: 'loser'
                        , image: 'img/configuration2.png'
                        , sticky: false
                        , before_close: function(gid){
                            return function(e, manual_close){
                                $scope.$apply(Action.forward('privilegeUserGroupList', 'privilege' , {page: 1, gid: gid}));
                            };
                        }($routeParams.gid)
                    });
                }else{
                    $scope.data[index].validity = status;
                }
            });

            return promise; //����promse����switch����ж���ʾ״̬
        };

        //ɾ��ָ���û���
        $scope.delete = function(object, index){
            object.isDelete = 1; //��ʶ�����ݱ�ɾ��

            UserGroupPrivilege.remove({pid: object.privId, gid: $routeParams.gid}).$promise.then(function(reponse){
                if(reponse['status'] == 0){

                    object.isDelete = 0;    //ȡ�������ݵ�ɾ��״̬

                    //ɾ��������ʾ
                    angular.element.gritter.add({
                        title: '��ʾ'
                        , text: '�û����ָ��Ȩ��ɾ��ʧ��!'
                        , class_name: 'loser'
                        , image: 'img/configuration2.png'
                        , sticky: false
                        , before_close: function(gid){
                            return function(e, manual_close){
                                $scope.$apply(Action.forward('privilegeUserGroupList', 'privilege' , {page: 1, gid: gid}));
                            };
                        }($routeParams.gid)
                    });

                }else{
                    //���б���ɾ����������
                    $scope.data.splice(index, 1);

                    //ɾ���¹���ʾ
                    angular.element.gritter.add({
                        title: '��ʾ'
                        , text: '�û����ָ��Ȩ��ɾ���ɹ�!'
                        , class_name: 'winner'
                        , image: 'img/save.png'
                        , sticky: false
                    });
                }
            });
        };


        var modalPromise = $modal({
            template: 'form.html'
            , persist: true
            , show: false
            , backdrop: 'static'
            , scope: $scope
        });

        var modal = $q.when(modalPromise);

        $scope.form = {gid: $scope.gid};

        //�����༭��ģ̬����
        $scope.modalWin = function(rule){
            console.log(rule);
            $scope.updateRule = rule;   //����ָ��ǰ�༭�Ĺ������ݶ������ڸ�����ʾ�б�

            if(rule.begin == '������'){
                $scope.form.begin = null;
            }else{
                $scope.form.begin = $filter('date')(rule.begin, 'yyyy-MM-dd');
            }

            if(rule.end == '������'){
                $scope.form.end = null;
            }else{
                $scope.form.end = $filter('date')(rule.end, 'yyyy-MM-dd');
            }

            $scope.form.pid = rule.privId;

            modal.then(function(modalEl){
                modalEl.modal('show');
            });
        };

        //����ָ���������Чʱ��
        $scope.updateDate = function(){
            UserGroupPrivilege.updateDate($scope.form).$promise.then(function(response){
                if(response['status'] == 1){

                    $scope.updateRule.begin = $filter('date')($scope.form.begin, 'yyyy-MM-dd');
                    $scope.updateRule.end = $filter('date')($scope.form.end, 'yyyy-MM-dd');

                    //�ɹ���ʾ
                    angular.element.gritter.add({
                        title: '��ʾ'
                        , text: 'Ȩ�޹�����ĳɹ�!'
                        , class_name: 'winner'
                        , image: 'img/save.png'
                        , sticky: false
                    });

                }else{
                    //������ʾ
                    angular.element.gritter.add({
                        title: '��ʾ'
                        , text: 'Ȩ�޹������ʧ��!'
                        , class_name: 'loser'
                        , image: 'img/save.png'
                        , sticky: false
                        , before_close:function(gid){
                            return function(e, manual_close){
                                $scope.$apply(Action.forward('privilegeUserGroupList', 'privilege' , {gid: gid, page: 1}));
                            };
                        }($routeParams.gid)
                    });
                }
            });
        };

        //��ȡ��һ������
        $scope.downloadData();
    }];
});