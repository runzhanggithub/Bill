<template>
	<div class="layout">
		<el-container v-if="authenticated.includes($route.name)" style="height: 100%; overflow: hidden">
			<el-aside width="200px">
				<el-scrollbar>
					<el-menu :router="true">
						<el-sub-menu index="2">
							<template #title>
								<el-icon>
									<message />
								</el-icon>
								交易管理
							</template>
							<el-menu-item-group>
								<el-menu-item index="/transaction_record">交易列表</el-menu-item>
							</el-menu-item-group>
						</el-sub-menu>
					</el-menu>
				</el-scrollbar>
			</el-aside>
			<el-container>
				<el-header>
					<el-dropdown @command="handleCommand">
						<div class="Avatar">
							<span>{{  cookies.get('account') || '黄金交易所' }}</span>
							<el-avatar src="https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png" />
						</div>
						<template #dropdown>
							<el-dropdown-menu>
								<!-- <el-dropdown-item command="ChangePassword">修改密码</el-dropdown-item> -->
								<el-dropdown-item command="Logout">退出登录</el-dropdown-item>
							</el-dropdown-menu>
						</template>
					</el-dropdown>
				</el-header>
				<el-main>
					<router-view />
				</el-main>
			</el-container>
		</el-container>
		<div v-else>
			<router-view />
		</div>
		<el-dialog
			v-model="dialogFormVisible"
			title="修改密码"
			@closed="CancelForm(ruleFormRef)"
			width="400px"
			center
			close-on-click-modal="false"
		>
			<el-form :model="PassWordForm" :rules="rules" ref="ruleFormRef">
				<el-form-item label="手机号" label-width="120px" prop="phone_num">
					<el-input v-model="PassWordForm.phone_num"></el-input>
				</el-form-item>
				<el-form-item label="手机验证码" label-width="120px" prop="phone_code">
					<div class="CodePass">
						<el-input v-model="PassWordForm.phone_code" clearable></el-input>
						<el-button @click="getCode(ruleFormRef)" :disabled="countDown != 0 || noPhone">
							{{ countDown == 0 ? "获取验证码" : countDown + "s 秒后重新获取" }}
						</el-button>
					</div>
				</el-form-item>
				<el-form-item label="新密码" label-width="120px" prop="password">
					<el-input v-model="PassWordForm.password"></el-input>
				</el-form-item>
			</el-form>
			<template #footer>
				<span class="Footer_Button">
					<el-button @click="dialogFormVisible = false">取消</el-button>
					<el-button type="primary" @click="SubmitForm(ruleFormRef)">确认</el-button>
				</span>
			</template>
		</el-dialog>
	</div>
</template>

<script setup lang="ts">
import { FormInstance, FormRules, MessageParamsWithType } from 'element-plus';
import { Md5 } from "ts-md5";
import { reactive, ref, getCurrentInstance, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useCookies } from "vue3-cookies";

const { cookies } = useCookies();

const ruleFormRef = ref<any>();
interface PassWordType {
	phone_num: string;
	phone_code: string;
	password: string;
}
const PassWordForm = ref<PassWordType>({
	phone_num: "",
	phone_code: "",
	password: "",
});
const { proxy } = getCurrentInstance() as any;
const router = useRouter();
const dialogFormVisible = ref<boolean>(false);
const authenticated = ref<any[]>(["transactionRecord"]);
const rules = reactive<FormRules<PassWordType>>({
	phone_num: [
		{ required: true, message: "手机号不能为空！", trigger: "change" },
		{
			validator(_rule: any, value, callback) {
				const regx = /^(?:(?:\+|00)86)?1\d{10}$/;
				if (regx.test(value)) {
          noPhone.value = false;
					callback();
				} else {
					callback(new Error("请输入正确的手机号"));
				}
			},
			trigger: "blur",
		},
	],
	phone_code: [{ required: true, message: "验证码不能为空！", trigger: "blur" }],
	password: [
		{ required: true, message: "密码不能为空！", trigger: "blur" },
		{
			validator(_rule, value, callback) {
				const regx = /^(?=.*[a-zA-Z])(?=.*\d).{6,}$/;
				if (value && regx.test(value)) {
					callback();
				} else {
					callback("请输入长度至少为六位且需包含至少一个字母和一个数字！");
				}
			},
			trigger: "blur",
		},
	],
});
let noPhone = ref<boolean>(true);
const countDown = ref<number>(0);

const SubmitForm = async (formrules: FormInstance | undefined) => {
	if (!formrules) return;
	await formrules.validate((valid, fields) => {
		if (valid) {
			const params = { ...PassWordForm.value, password: Md5.hashStr(PassWordForm.value.password) };
			proxy.$axios
				.post("/apis/api/1.0/user/change_password", params)
				.then((result: { re_code: number; msg: MessageParamsWithType }) => {
					if (result.re_code == 0) {
						ElMessage({
							message: "修改成功",
							type: "success",
						});
						dialogFormVisible.value = false;
					} else {
						ElMessage.error(result.msg);
					}
				})
				.catch((_err: any) => {});
		} else {
			console.log("error submit!", fields);
		}
	});
};
const CancelForm = (FormRules: any) => {
	FormRules.resetFields();
	dialogFormVisible.value = false;
};
const handleCommand = (command: string | number | object) => {
	if (command == "ChangePassword") {
		dialogFormVisible.value = true;
	}
	if (command == "Logout") {
		proxy.$axios.delete("/apis/api/1.0/user/logout").then((res: any) => {
			if (res.re_code === "0") {
				ElMessage({
					message: "退出登录成功",
					type: "success",
				});
				setTimeout(() => {
					cookies.remove("access_token", "");
					cookies.remove("access_token_exp", "");
					cookies.remove("refresh_token", "");
					cookies.remove("account", "");
					router.push("/login");
				}, 200);
			}
		});
	}
};

const getCode = (FormRules: any) => {
	FormRules.validateField("phone_num", (bool: boolean) => {
		if (bool) {
      countDown.value = 60;

			proxy.$axios
				?.get("/apis/api/1.0/user/smsCode", { phone_num: PassWordForm.value.phone_num })
				.then((result: any) => {
					if (result.re_code == 0) {
            ElMessage({
							message: "发送成功",
							type: "success",
						});
					} else {
            ElMessage({
							message: result.msg || '发送失败',
							type: "error",
						});
          }
				})
				.catch((err: any) => {
          ElMessage({
							message: err || '发送失败',
							type: "error",
						});
					console.log("修改密码验证码错误", err);
				});
        const Time = setInterval(() => {
          countDown.value = countDown.value - 1;
          if (countDown.value == 0) {
            clearTimeout(Time);
          }
        }, 1000);
		}
	});
};
</script>

<style scoped>
.layout {
}

.el-aside {
	/* background-color: #1F2937; */
	height: 100vh;
	overflow: auto;
}

.el-header {
	/* background-color:yellow; */
	background-color: white;
}

.el-main {
	background-color: #eeeff3;
	height: calc(100vh - 80px);
	overflow: auto;
}

.el-dropdown {
	width: 100%;
	height: 100%;
	display: flex;
	justify-content: end;
}

.Avatar {
	display: flex;
	gap: 10px;
	align-items: center;
	outline: none;
}

.CodePass {
	display: grid;
	grid-template-columns: 2fr 0.3fr;
	gap: 10px;
}
</style>

<!-- #4F46E5 -->
