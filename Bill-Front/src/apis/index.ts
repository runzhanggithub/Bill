import axios from "axios";
import { useCookies } from "vue3-cookies";
const { cookies } = useCookies();

// axios.defaults.baseURL = ''  //正式
// axios.defaults.baseURL = 'https://www.fastmock.site/mock/eba0dfae18afc7f633c011ee1f464a6a/Bill' //测试

//post请求头
axios.defaults.headers.post["Content-Type"] = "application/json";
axios.defaults.headers.delete["Content-Type"] = "application/json";
//允许跨域携带cookie信息
axios.defaults.withCredentials = true;
//设置超时
axios.defaults.timeout = 15000;
axios.interceptors.request.use(
  (config: any) => {
    config.headers['Authorization'] = 'Bearer ' + cookies.get('access_token')
    return config;
  },
  (error: any) => {
    return Promise.reject(error);
  }
);

axios.interceptors.response.use(
  (response: any) => {
    if (response.status == 200) {
      return Promise.resolve(response);
    } else {
      return Promise.reject(response);
    }
  },
  (error: any) => {
    console.log('请求异常', error);
  }
);

axios.interceptors.request.use(
  async (config) => {
    const isAccessTokenExpired = checkAccessTokenExpiry(); // 自定义函数，检查access_token是否过期

    if (isAccessTokenExpired) {
      try {
        const response = await axios.post('/apis/api/1.0/user/refresh_token', {
          refresh_token: cookies.get('refresh_token'),
        });

        const { access_token, access_token_exp, refresh_token } = response.data;
        cookies.set('access_token', access_token);
        cookies.set('access_token_exp', access_token_exp);
        cookies.set('refresh_token', refresh_token);
        config.headers.Authorization = `Bearer ${access_token}`;
      } catch (error) {
        console.error('刷新access_token失败:', error);
      }
    }

    return config;
  },
  (error) => {
    // 处理请求错误
    console.error('请求拦截器发生错误:', error);
    return Promise.reject(error);
  }
);

function checkAccessTokenExpiry() {
  const date = cookies.get('access_token_exp')
  if (!date) {
    return false
  }

  const accessTokenExp = new Date(date);
  const currentTime = new Date();

  return accessTokenExp.getTime() <= currentTime.getTime() + 600000;
}

export default {
  /**
   * @param {String} url 
   * @param {Object} data 
   * @returns Promise
   */
  post(url: string, data: any) {
    return new Promise((resolve, reject) => {
      axios({

        method: 'post',
        url,
        data: data,

      })
        .then((res: any) => {
          resolve(res.data)
        })
        .catch((err: any) => {
          reject(err)
        });
    })
  },

  get(url: string, data: any) {
    return new Promise((resolve, reject) => {
      axios({
        method: 'get',
        url,
        params: data,
      })
        .then((res: any) => {
          resolve(res.data)
        })
        .catch((err: any) => {
          reject(err)
        })
    })
  },

  delete(url: string, data: any) {
    return new Promise((resolve, reject) => {
      axios({
        method: 'delete',
        url,
        data: data,
      })
        .then((res: any) => {
          resolve(res.data)
        })
        .catch((err: any) => {
          reject(err)
        })
    })
  },
};
