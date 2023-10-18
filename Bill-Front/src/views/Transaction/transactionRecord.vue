<!-- transaction record page:
    1、交易列表，分页可选
    2、支持按时间查询
    3、支持按时间导出对账账单 
-->
<template>
	<div class="Layout">
		<div class="Head">
			<el-card shadow="always">
				<div class="Search">
					<!-- 列表查询条件 -->
					<el-form :inline="true" :model="Tabelform" class="SearchForm" label-width="100px">
						<el-form-item label="交易日期">
							<el-date-picker
								:disabled-date="DisabledDate"
								v-model="Tabelform.date"
								type="daterange"
								start-placeholder="开始日期"
								end-placeholder="结束日期"
							/>
						</el-form-item>
					</el-form>
				</div>
				<div class="check">
					<el-button type="primary" plain size="medium" @click="Reset">重置</el-button>
					<el-button type="primary" plain size="medium" @click="ChechkForm">查询</el-button>
				</div>
				<!-- 工具栏 -->
				<div class="tools">
					<el-button type="primary" plain @click="dialogFormVisible = true">新增</el-button>
					<el-button type="primary" plain @click="Export">导出</el-button>
				</div>
			</el-card>
		</div>
		<div class="Content">
			<!-- 列表 -->
			<el-card shadow="always">
				<el-table
					:data="tableData"
					height="500px"
					@selection-change="handleSelectionChange"
					highlight-current-row="true"
					stripe="true"
					v-loading="Tabelloading"
					element-loading-text="加载中..."
				>
					<el-table-column type="index" width="55"></el-table-column>
					<el-table-column prop="bill_number" label="账单号" width="210" show-overflow-tooltip="true"></el-table-column>
					<el-table-column prop="type" label="交易类型" width="180">
						<template #default="scope">
							<div>{{ Type[scope.row.type] }}</div>
						</template>
					</el-table-column>
					<el-table-column prop="amount" label="资金" width="100">
						<template #default="scope">
							<div>{{ AccountType[scope.row.direction] + scope.row.amount }}</div>
						</template>
					</el-table-column>
					<el-table-column prop="create_time" label="交易时间" width="170"></el-table-column>
					<el-table-column prop="remarks" label="备注" show-overflow-tooltip="true"></el-table-column>
					<el-table-column fixed="right" label="操作" width="120">
						<template #default="scope">
							<el-button link type="danger" size="small" @click="handleEdite(scope.row)">修改</el-button>
							<el-popconfirm title="是否删除" @confirm="handledelete(scope.row)" cancel-button-type="danger">
								<template #reference>
									<el-button link type="danger" size="small">删除</el-button>
								</template>
							</el-popconfirm>
						</template>
					</el-table-column>
					<template v-slot:empty>
						<el-empty description="暂无数据" />
					</template>
				</el-table>
				<div class="Content_Foot">
					<el-pagination
						@current-change="handleCurrentChange"
						@size-change="handleSizeChange"
						v-model:page-size="pageSize"
						v-model:current-page="currentPage"
						background="#ffffff"
						:total="TabelTotal"
						layout="total, sizes, prev, pager, next, jumper"
					></el-pagination>
				</div>
			</el-card>
			<!-- 新增编辑 -->
			<el-dialog
				v-model="dialogFormVisible"
				:title="AddForm.id ? '修改账单' : '新增账单'"
				@closed="CancelForm(ruleFormRef)"
				width="500px"
			>
				、
				<el-form :model="AddForm" :rules="rules" ref="ruleFormRef">
					<el-form-item label="账单类型" label-width="120px" prop="type">
						<el-radio-group v-model="AddForm.type" v-for="i in Object.keys(Type)">
							<el-radio :label="i" size="large">{{ Type[i] }}</el-radio>
						</el-radio-group>
					</el-form-item>
					<el-form-item label="账单金额" label-width="120px" prop="amount">
						<el-input
							v-model="AddForm.amount"
							:formatter="(value: any) => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')"
							:parser="(value: any) => value.replace(/\$\s?|(,*)/g, '')"
							clearable
						></el-input>
					</el-form-item>
					<el-form-item label="备注" label-width="120px" prop="remarks">
						<el-input v-model="AddForm.remarks" type="textarea"></el-input>
					</el-form-item>
				</el-form>
				<template #footer>
					<span class="Footer_Button">
						<el-checkbox v-model="ContinuousEntry" label="连续录入" size="large" v-if="!AddForm.id" />
						<el-button @click="dialogFormVisible = false">取消</el-button>
						<el-button type="primary" @click="SubmitForm(ruleFormRef)">提交</el-button>
					</span>
				</template>
			</el-dialog>
		</div>
	</div>
</template>

<script lang="ts" setup>
import dayjs from "dayjs";
import { ref, reactive, getCurrentInstance, onMounted } from "vue";
import { type FormInstance, type FormRules } from "element-plus";
import ExcelJS from "exceljs";
import { deepCloneObj } from "../../utils";
const { proxy } = getCurrentInstance() as any;
// 账单号，资金，备注，时间，交易类型
interface tableData {
	id: number;
	bill_number: string; //账单号
	type: string; //交易类型
	amount: number | undefined; //资金
	create_time: string; //时间
	remarks: string; //备注
}
interface Tabelform {
	date: string[];
	start_date: Date | undefined; //开始时间
	end_date: Date | undefined; //结束时间
	p: string; //第几页;
}
interface AddForm {
	id: number | undefined;
	type: string; //账单类型
	amount: string; //账单金额
	remarks: string; //账单备注
}
const Type: any = { CONSUMPTION: "消费", EXPORT: "汇出", IMPORT: "汇入" };
const AccountType: any = { IN: "+", OUT: "-" };
const tableData = ref<tableData[]>([]);
const Tabelform = ref<Tabelform>({
	date: [
		dayjs(new Date().setHours(0, 0, 0, 0)).subtract(1, "months").format("YYYY-MM-DD HH:mm:ss"),
		dayjs(new Date().setHours(23, 59, 59, 59)).format("YYYY-MM-DD HH:mm:ss"),
	],
	start_date: undefined,
	end_date: undefined,
	p: "",
});
const AddForm = ref<{
	id: number | undefined;
	bill_number: string;
	type: string; //交易类型
	amount: number | undefined; //资金
	remarks: string; //备注
}>({
	id: undefined,
	bill_number: "",
	type: "",
	amount: undefined,
	remarks: "",
});

const ruleFormRef = ref<FormInstance>();
const currentPage = ref<number>(1);
const pageSize = ref<number>(10);
const dialogFormVisible = ref<boolean>(false);
const Tabelloading = ref<boolean>(false);
const SelectRows = ref<tableData[]>([]);
const TabelTotal = ref<number>(0);
const rules = reactive<FormRules<AddForm>>({
	type: [{ required: true, message: "账单类型不能为空！", trigger: "blur" }],
	amount: [
		{ required: true, message: "账单金额不能为空！", trigger: "blur" },
		{
			validator(_rule, value, callback) {
				const regx = /^\d+(\.\d{1,2})?$/;
				if (value && regx.test(value)) {
					callback();
				} else {
					callback(new Error("请输入整数且最多两位小数"));
				}
			},
			trigger: "blur",
		},
	],
});
const ContinuousEntry = ref<boolean>(false);
//当前页
const handleCurrentChange = (page: any) => {
	currentPage.value = page;
	ChechkForm();
};
const handleSizeChange = (pz: any) => {
	pageSize.value = pz;
	ChechkForm();
};
const handleSelectionChange = (val: tableData[]) => {
	SelectRows.value = val;
};
//默认展示半年账单，最大可选择时间区间为一年
const DisabledDate = (date: Date) => {
	return dayjs(date) >= dayjs(new Date());
};
//新增/修改
const SubmitForm = async (formrules: FormInstance | undefined) => {
	if (!formrules) return;
	await formrules.validate((valid, fields) => {
		if (valid) {
			proxy?.$axios
				.post(AddForm.value.id ? "/apis/api/1.0/bill/modify" : "/apis/api/1.0/bill/create", AddForm.value)
				.then((result: { re_code: any }) => {
					if (result.re_code == 0) {
						ChechkForm();

						if (ContinuousEntry.value && !AddForm.value.id) {
							formrules?.resetFields();
						} else {
							dialogFormVisible.value = false;
						}
					}
				})
				.catch((err: any) => {
					console.log("提交错误", err);
				});
		} else {
			console.log("error submit!", fields);
		}
	});
};

const handleEdite = (row: tableData) => {
	AddForm.value = deepCloneObj(row);
	dialogFormVisible.value = true;
};
//删除
const handledelete = (row: tableData) => {
	const { id } = row;
	proxy?.$axios
		.delete("/apis/api/1.0/bill/delete", { id })
		.then((result: { re_code: number }) => {
			if (result.re_code == 0) {
				ChechkForm();
			}
		})
		.catch((err: any) => {
			console.log("删除失败:", err);
		});
};
const CancelForm = (formrules: FormInstance | undefined) => {
	AddForm.value = { id: undefined, bill_number: "", type: "", amount: undefined, remarks: "" };
	formrules?.clearValidate();
};
//查询
const ChechkForm = () => {
	Tabelloading.value = true;
	console.log("Tabelform.value.date[1]", new Date(Tabelform.value.date[1]).setHours(23, 59, 59, 59));

	const param = {
		start_date: new Date(Tabelform.value.date[0]).setHours(0, 0, 0, 0),
		end_date: new Date(Tabelform.value.date[1]).setHours(23, 59, 59, 59),
		p: currentPage.value,
		pz: pageSize.value,
	};
	proxy.$axios
		.get("/apis/api/1.0/bill/list", param)
		.then((result: { data: { bills: any; total: any }; re_code: number }) => {
			const { bills, total } = result.data;
			if (result.re_code == 0) {
				Tabelloading.value = false;
				tableData.value = bills;
				TabelTotal.value = total;
			}
		})
		.catch((err: any) => {
			console.log("err", err);
		});
};
const Reset = () => {
	Tabelform.value.date = [
		dayjs(new Date().setHours(0, 0, 0, 0)).subtract(1, "months").format("YYYY-MM-DD HH:mm:ss"),
		dayjs(new Date().setHours(23, 59, 59, 59)).format("YYYY-MM-DD HH:mm:ss"),
	];
	ChechkForm();
};
//导出
const Export = () => {
	const param = {
		start_date: new Date(Tabelform.value.date[0]).setHours(0, 0, 0, 0),
		end_date: new Date(Tabelform.value.date[1]).setHours(23, 59, 59, 59),
	};
	proxy.$axios
		.get("/apis/api/1.0/bill/export", param)
		.then(
			(result: {
				data: { bills: any; total: any; account: string; total_in: string; total_out: string };
				re_code: number;
			}) => {
				const { bills, total_in, total_out, account, total } = result.data;
				if (result.re_code == 0) {
					const workbook = new ExcelJS.Workbook();
					const SheetName = `${account} (${dayjs(Tabelform.value.date[0]).format("YYYYMMDD")}-${dayjs(
						Tabelform.value.date[1]
					).format("YYYYMMDD")})`;
					const sheet = workbook.addWorksheet(SheetName);

					const columns = [
						{
							header: "序号",
							key: "index",
							width: 10,
						},
						{
							header: "账单号",
							key: "bill_number",
							width: 20,
						},
						{
							header: "交易类型",
							key: "type",
							width: 20,
						},
						{
							header: "资金",
							key: "amount",
							width: 20,
						},
						{
							header: "交易时间",
							key: "create_time",
							width: 20,
						},
						{
							header: "备注",
							key: "remarks",
							width: 10,
						},
					];

					sheet.columns = columns;
					// 数据行
					bills.forEach((item: any, index: any) => {
						const Lists = columns.map((o) => {
							if (o.key == "index") {
								item[o.key] = index + 1;
							}
							if (o.key == "type") {
								item[o.key] = Type[item[o.key]];
							}
							if (o.key == "amount") {
								item[o.key] = AccountType[item.direction] + item[o.key];
							}

							return item[o.key];
						});
						sheet.addRow(Lists);
					});

					// 表头样式
					const excelBaseStyle = {
						font: {
							size: 15,
							bold: true,
						},
						fill: {
							type: "pattern",
							pattern: "solid",
							fgColor: { argb: "808080" },
						},
						border: {
							top: { style: "thin", color: { argb: "9e9e9e" } },
							left: { style: "thin", color: { argb: "9e9e9e" } },
							bottom: { style: "thin", color: { argb: "9e9e9e" } },
							right: { style: "thin", color: { argb: "9e9e9e" } },
						},
					};

					const headerRow = sheet.getRow(1);
					headerRow.eachCell((cell) => {
						cell.style = excelBaseStyle as Partial<ExcelJS.Style>;
					});
					for (let i = 0; i < columns.length; i++) {
						const line = sheet.getColumn(i + 1);
						line.eachCell((cell) => {
							cell.style = {
								alignment: { vertical: "middle", horizontal: "center", wrapText: true },
							} as Partial<ExcelJS.Style>;
						});
					}
					sheet.mergeCells(total + 2, 1, total + 2, columns.length);
					sheet.getCell(`B${total + 2}`).value = `期间总支出：${total_out}；期间总收入：${total_in}；`;
					// 剧中
					sheet.getCell(`B${total + 2}`).alignment = { vertical: "middle", horizontal: "center" };
					sheet.getCell(`B${total + 2}`).font = {
						name: "宋体",
						family: 4,
						size: 16,
					};
					workbook.xlsx.writeBuffer().then((buffer) => {
						let file = new Blob([buffer], {
							type: "application/octet-stream",
						});
						const downloadLink = document.createElement("a");
						downloadLink.href = URL.createObjectURL(file);
						downloadLink.download = SheetName + ".xlsx";
						downloadLink.click();
					});
				}
			}
		)
		.catch((err: any) => {
			console.log("err", err);
		});
};
onMounted(() => {
	ChechkForm();
});
</script>

<style scoped>
.Head {
	margin-bottom: 20px;
}

.Content {
	height: calc(100%-400px);
	margin-bottom: 20px;
}

.tools {
	margin-top: 20px;
}

.Content_Foot {
	display: flex;
	justify-content: end;
	margin-top: 10px;
}

.Search {
	display: flex;
	gap: 10px;
}

.check {
	display: flex;
	justify-content: center;
	margin-top: 10px;
}

.Footer_Button {
	display: flex;
	justify-content: end;
	gap: 10px;
	align-items: center;
}
</style>
