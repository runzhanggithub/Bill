<template>
	<div>
		<el-form ref="ruleFormRef" :model="signInData" :rules="signInRules" status-icon>
			<el-form-item prop="phone_num">
				<el-input v-model="signInData.phone_num" placeholder="请输入手机号"></el-input>
			</el-form-item>
			<el-form-item prop="phone_code">
				<div class="CodePass">
					<el-input v-model="signInData.phone_code" clearable placeholder="请输入验证码"></el-input>
					<el-button @click="getCode(ruleFormRef)" :disabled="countDown != 0 || noPhone">
						{{ countDown == 0 ? "获取验证码" : countDown + "s 后重新获取" }}
					</el-button>
				</div>
			</el-form-item>
			<el-form-item prop="password">
				<el-input v-model="signInData.password" placeholder="请输入密码"></el-input>
			</el-form-item>
			<el-form-item prop="confirm">
				<el-input v-model="signInData.confirm" placeholder="请确认密码"></el-input>
			</el-form-item>
			<el-form-item class="login-form-item">
				<el-button class="login-button" type="primary" @click="handleRegister(ruleFormRef)">{{ confirmName }}</el-button>
			</el-form-item>
		</el-form>
	</div>
</template>

<script lang="ts" setup>
import { ref, reactive, getCurrentInstance, watch } from "vue";
const { proxy } = getCurrentInstance() as any;
import { Md5 } from "ts-md5";
import { FormInstance, FormRules } from "element-plus";

interface SignInData {
	phone_num: string;
	phone_code: string;
	password: string;
	confirm: string;
}

let signInData = ref<SignInData>({
	phone_num: "",
	phone_code: "",
	password: "",
	confirm: "",
});

let noPhone = ref<boolean>(true);
const ruleFormRef = ref<FormInstance>();

const validatePhone = (_rule: any, value: string, callback: any) => {
	const pattern = /^1[0-9]{10}$/;
	if (!value) {
		callback(new Error("电话号码不能为空"));
	} else if (!pattern.test(value)) {
		callback(new Error("请输入正确的电话号码"));
	} else {
    noPhone.value = false;
		callback();
	}
};

const signInRules = reactive<FormRules<any>>({
	phone_num: [
		{
			required: true,
			message: "请输入手机号",
			trigger: "blur",
		},
    {
			validator: validatePhone,
			trigger: "blur",
    }
	],
	phone_code: [
		{
			required: true,
			message: "请输入验证码",
			trigger: "blur",
		},
	],
	password: [
		{
			required: true,
			message: "请输入密码",
			trigger: "blur",
		},
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
	confirm: [
		{
			required: true,
			message: "请确认密码",
			trigger: "blur",
		},
	],
});

const countDown = ref<number>(0);
const confirmName = ref<string>('注册');
const emits = defineEmits(["getActiveName"]);
const props = defineProps({
  currentEvent: String
})

watch(() => props.currentEvent, (newValue) => {
  confirmName.value = newValue
});

const getCode = (FormRules: any) => {
	FormRules.validateField("phone_num", (bool: boolean, _b: any) => {
		if (bool) {
      countDown.value = 60;
			proxy.$axios
				?.get("/apis/api/1.0/user/smsCode", { phone_num: signInData.value.phone_num })
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
					console.log("验证码错误", err);
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

const handleRegister = async (formEl: FormInstance | undefined) => {
	if (!formEl) return;
	await formEl.validate((valid, fields) => {
		if (valid) {
			const params = {
				phone_num: signInData.value.phone_num,
				phone_code: Number(signInData.value.phone_code),
				password: Md5.hashStr(signInData.value.password),
			};
      if (confirmName.value === '注册') {
        proxy?.$axios
				.post("/apis/api/1.0/user/register", {
					...params,
					password: Md5.hashStr(signInData.value.password),
				})
				.then((res: { re_code: string; msg: any }) => {
					if (res.re_code === "0") {
						signInData.value = {
							phone_num: "",
							phone_code: "",
							password: "",
							confirm: "",
						};
						ElMessage({
							message: "注册成功",
							type: "success",
						});
						setTimeout(() => {
							emits("getActiveName", "login");
						}, 500);
					} else {
						ElMessage({
							message: res.msg || "注册失败",
							type: "error",
						});
					}
				});
      } else {
        proxy.$axios
				.post("/apis/api/1.0/user/change_password", params)
				.then((result: { re_code: number; msg: any }) => {
					if (result.re_code === '0') {
            signInData.value = {
							phone_num: "",
							phone_code: "",
							password: "",
							confirm: "",
						};
						ElMessage({
							message: "修改成功",
							type: "success",
						});
            setTimeout(() => {
							emits("getActiveName", "login");
						}, 500);
					} else {
            ElMessage({
							message: res.msg || "修改失败",
							type: "error",
						});
					}
				})
				.catch((_err: any) => {});
      }

		} else {
			console.log("error handleRegister!", fields);
		}
	});
};
</script>

<style scoped>
.CodePass {
	display: grid;
	grid-template-columns: 3fr 0.3fr;
	gap: 10px;
}

.login-button {
	width: 100vw;
}
</style>
