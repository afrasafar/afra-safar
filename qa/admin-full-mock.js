/* Test-only in-memory backend. This file is never loaded by the website. */
(mode => {
  const P1="11111111-1111-4111-8111-111111111111",P2="44444444-4444-4444-8444-444444444444",U="22222222-2222-4222-8222-222222222222",R1="33333333-3333-4333-8333-333333333333",R2="55555555-5555-4555-8555-555555555555";
  const created="2026-11-20T09:00:00Z";
  const property={id:P1,title:"ویلای آزمایشی",location:"رامسر",category:"villa",capacity:4,price:1000000,description:"توضیح اولیه",image_url:"images/afra-hero-forest-villa.webp",is_active:true,owner_id:U,created_at:created,updated_at:created};
  const reservation={id:R1,reservation_code:"QA-1001",property_id:P1,guest_name:"مسافر آزمایشی",guest_phone:"09120000000",guest_count:2,guest_message:"توضیح مسافر",check_in:"2027-01-01",check_out:"2027-01-03",status:"pending",payment_status:"unpaid",payment_amount:null,payment_base_amount:null,discount_code:null,discount_percent:0,discount_amount:0,payment_deadline_at:null,created_at:created};
  let stored=null;try{stored=JSON.parse(sessionStorage.getItem("__afra_qa_db")||"null");}catch(_){}
  const state=stored||{role:mode,events:[],tables:{properties:[property,{...property,id:P2,title:"کلبه <img src=x onerror=window.__qaInjected=1>",category:"forest",is_active:false}],property_images:[{id:1,property_id:P1,image_url:"images/afra-hero-forest-villa.webp",sort_order:3,created_at:created}],reservations:[reservation,{...reservation,id:R2,reservation_code:"QA-1002",check_in:"2027-02-01",check_out:"2027-02-03",status:"confirmed",payment_amount:1840000,payment_base_amount:2000000,discount_percent:8,discount_amount:160000,payment_deadline_at:"2027-01-31T12:00:00Z"}],owner_profiles:[{user_id:U,full_name:"میزبان آزمایشی",phone:"09120000000",approval_status:"pending",created_at:created}],afra_profiles:[{user_id:U,full_name:"کاربر آزمایشی",phone:"09120000000",city:"رامسر",created_at:created}],afra_reviews:[{id:"review-test",property_id:P1,guest_user_id:U,score:4,body:"نظر آزمایشی",moderation_status:"pending",created_at:created,moderated_at:null}],afra_support_tickets:[{id:"ticket-test",user_id:U,subject:"پشتیبانی آزمایشی",category:"booking",message:"پیام آزمایشی",status:"open",admin_reply:null,created_at:created,updated_at:created}]}};
  const persist=()=>sessionStorage.setItem("__afra_qa_db",JSON.stringify(state));
  const qa=window.__qa={state,role:state.role,failGallery:0,failStorage:0,P1,P2,U,R1,R2,persist};
  const me={id:U,email:"synthetic.admin.long.email@example.test",phone:"09120000000"};
  const event=(kind,table,payload)=>{state.events.push({kind,table,payload});persist();};
  const eq=(a,b)=>a===b||String(a)===String(b);
  const builder=table=>{
    let action="select",payload=null,filters=[],single=false,head=false,count=false,selected=false,order=[],limit=null;
    const q=new Proxy({}, {get(_,name){
      if(name==="then")return (resolve,reject)=>Promise.resolve().then(()=>{
        let rows=[...(state.tables[table]||[])];for(const f of filters)rows=rows.filter(f);
        if(action!=="select"&&qa.role!=="admin")return {data:null,error:{code:"42501",message:"Denied"}};
        if(action==="insert"){
          if(table==="property_images"&&qa.failGallery>0){qa.failGallery--;return {data:null,error:{code:"42501",message:"Synthetic gallery write failure"}};}
          rows=(Array.isArray(payload)?payload:[payload]).map((x,index)=>({created_at:created,...x,id:x.id||(table==="property_images"?((state.tables[table]||[]).length+index+1):crypto.randomUUID())}));
          if(table==="properties"&&rows.some(x=>(state.tables.properties||[]).some(y=>y.id===x.id)))return {data:null,error:{code:"23505",message:"Duplicate property id"}};
          state.tables[table]||=[];state.tables[table].push(...rows);event("insert",table,payload);
        }else if(action==="update"){
          if(table==="reservations"&&payload.status==="confirmed"){
            const conflict=rows.some(x=>state.tables.reservations.some(y=>y.id!==x.id&&y.status==="confirmed"&&y.property_id===x.property_id&&y.check_in<x.check_out&&x.check_in<y.check_out));
            if(conflict)return {data:null,error:{code:"23P01",message:"Overlapping confirmed booking"}};
          }
          rows.forEach(x=>{Object.assign(x,payload);if(table==="reservations"&&payload.status==="confirmed"){x.payment_amount=2000000;x.payment_base_amount=2000000;x.payment_deadline_at="2027-01-01T12:20:00Z";}});event("update",table,payload);
        }else if(action==="delete"){
          state.tables[table]=(state.tables[table]||[]).filter(x=>!rows.includes(x));
          if(table==="properties")state.tables.reservations=state.tables.reservations.filter(x=>!rows.some(p=>p.id===x.property_id));
          event("delete",table,{ids:rows.map(x=>x.id)});
        }
        for(const o of order)rows.sort((a,b)=>String(a[o.key]??"").localeCompare(String(b[o.key]??""))*(o.ascending?1:-1));
        const total=rows.length;if(limit!=null)rows=rows.slice(0,limit);
        if(head)return {data:null,count:total,error:null};
        if(single==="required"&&rows.length!==1)return {data:null,error:{code:"PGRST116",message:"Expected one row"}};
        if(action!=="select"&&!selected)return {data:null,error:null};
        const returned=structuredClone(rows);
        return {data:single?(returned[0]||null):returned,count:count?total:null,error:null};
      }).then(resolve,reject);
      if(name==="select")return(columns="*",opts={})=>{selected=true;head=!!opts.head;count=!!opts.count;return q;};
      if(name==="insert"||name==="update"||name==="delete")return x=>{action=name;payload=x;return q;};
      if(name==="eq")return(k,v)=>{filters.push(x=>eq(x[k],v));return q;};
      if(name==="in")return(k,v)=>{filters.push(x=>v.some(y=>eq(x[k],y)));return q;};
      if(name==="order")return(k,opts={})=>{order.push({key:k,ascending:opts.ascending!==false});return q;};
      if(name==="limit")return n=>{limit=n;return q;};
      if(name==="single")return()=>{single="required";return q;};
      if(name==="maybeSingle")return()=>{single="optional";return q;};
      return()=>q;
    }});return q;
  };
  const auth={signInWithPassword:async credentials=>{if(credentials.password!=="test-only-password")return {error:{message:"Invalid credentials"}};qa.role="admin";state.role="admin";persist();return {data:{user:me},error:null};},getUser:async()=>({data:{user:qa.role==="guest"?null:me},error:null}),getSession:async()=>({data:{session:qa.role==="guest"?null:{user:me}},error:null}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}}),signOut:async()=>{qa.role="guest";state.role="guest";persist();return {error:null};}};
  const db={auth,from:builder,rpc:async name=>name==="is_admin"?{data:qa.role==="admin",error:null}:{data:[],error:null},storage:{from:bucket=>({upload:async(path,file,opts)=>{if(qa.role!=="admin")return {error:{code:"42501",message:"Denied"}};if(qa.failStorage>0){qa.failStorage--;return {error:{message:"Synthetic storage upload failure"}};}event("upload",bucket,{path,bytes:file.size,type:file.type,upsert:opts.upsert});return {data:{path},error:null};},getPublicUrl:path=>({data:{publicUrl:location.origin+"/__qa-storage__/"+path}})})},channel:()=>({on(){return this;},subscribe(){return this;},unsubscribe(){}})};
  window.afraSupabase=db;window.supabase={createClient:()=>db};
})
