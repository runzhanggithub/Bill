<template>
  <div class="common-layout">
    <el-container>
      <el-main>
        <div class="login-container">
          <el-card class="login-card" shadow="hover">
            <el-tabs v-model="activeName" type="card" @tab-click="handleClick" :stretch=true>
              <el-tab-pane label="登录" name="login">
                <div style="margin-top: 20px">
                  <Login @getActiveInfo="getActiveInfo"/>
                </div>
              </el-tab-pane>
              <el-tab-pane :label="activeEvent" name="signIn">
                <div style="margin-top: 20px">
                  <SignIn @getActiveName="getActiveName" :currentEvent="activeEvent" />
                </div>
              </el-tab-pane>
            </el-tabs>
          </el-card>
        </div>
      </el-main>
    </el-container>
  </div>
</template>

<script lang="ts" setup>
import { ref, } from 'vue';
import SignIn from './signIn.vue';
import Login from './login.vue';

import type { TabsPaneContext } from 'element-plus'

let activeName = ref('login');
let activeEvent = ref('注册');


const getActiveName = (data: string) => {
  activeName.value = data;
};

const getActiveInfo = (data: object) => {
  const { name = '', event = '' } = data;
  activeName.value = name;
  activeEvent.value = event;
};

const handleClick = (tab: TabsPaneContext, _event: Event) => {
  if (tab.props.name === 'login') {
    activeEvent.value = '注册';
  }
  console.log('tab.props.name', tab.props.name)
}

</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
}

.login-card {
  width: 400px;
  height: 350px;
  padding: 40px;
  border: 1px solid #ebeef5;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}
</style>
