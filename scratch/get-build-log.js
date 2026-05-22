const token = 'NE0O86cM8A1rrLOSzkDXdyf1QaIVGtAp0irU_TU2BPQ.e_TSKqMscQ5uy7qHMp7le0fXqmTyMLN4hsdDtaEmEoM';
const accountId = '9d1f40fe9d4955f5baac25b829678cee';
const projectName = 'touring-mania-vite';
const deploymentId = '09af97a2-4a89-42fe-a5f3-d5cf7c0570e3';

const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects/${projectName}/deployments/${deploymentId}/history/logs`;

fetch(url, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
.then(res => res.json())
.then(data => console.log(JSON.stringify(data, null, 2)))
.catch(err => console.error(err));
