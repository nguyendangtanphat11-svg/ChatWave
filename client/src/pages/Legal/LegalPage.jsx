import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaArrowLeft, FaCheckCircle, FaLock, FaShieldAlt } from 'react-icons/fa';
import Footer from '../Home/Footer';
import './LegalPage.css';

const TERMS_SECTIONS = [
    { title: '1. Chấp nhận điều khoản', content: 'Khi tạo tài khoản hoặc sử dụng ChatWave, bạn xác nhận đã đọc, hiểu và đồng ý tuân thủ các điều khoản này. Nếu không đồng ý, vui lòng ngừng sử dụng dịch vụ.' },
    { title: '2. Tài khoản và trách nhiệm', content: 'Bạn có trách nhiệm bảo mật thông tin đăng nhập, cung cấp thông tin chính xác và chịu trách nhiệm với hoạt động diễn ra từ tài khoản của mình. Không chia sẻ tài khoản hoặc dùng tài khoản để mạo danh người khác.' },
    { title: '3. Quy tắc cộng đồng', content: 'Không đăng tải, gửi hoặc chia sẻ nội dung trái pháp luật, quấy rối, đe dọa, lừa đảo, xâm phạm quyền riêng tư hay quyền sở hữu trí tuệ. Chúng tôi có thể giới hạn hoặc khóa tài khoản vi phạm để bảo vệ cộng đồng.' },
    { title: '4. Nội dung do người dùng tạo', content: 'Bạn sở hữu nội dung mình đăng tải và chịu trách nhiệm về nội dung đó. Bạn cấp cho ChatWave quyền cần thiết để lưu trữ, hiển thị và truyền tải nội dung nhằm vận hành dịch vụ.' },
    { title: '5. Thay đổi dịch vụ', content: 'ChatWave có thể cập nhật tính năng hoặc điều khoản khi cần thiết. Với thay đổi quan trọng, chúng tôi sẽ thông báo hợp lý trên ứng dụng. Việc tiếp tục sử dụng sau thời điểm hiệu lực đồng nghĩa bạn chấp nhận thay đổi.' },
];

const PRIVACY_SECTIONS = [
    { title: '1. Thông tin chúng tôi thu thập', content: 'Chúng tôi thu thập thông tin bạn cung cấp khi đăng ký và sử dụng dịch vụ, như tên người dùng, email, ảnh đại diện, thông tin hồ sơ, nội dung tương tác và dữ liệu kỹ thuật cần thiết để vận hành ứng dụng.' },
    { title: '2. Cách chúng tôi sử dụng dữ liệu', content: 'Dữ liệu được dùng để xác thực tài khoản, cung cấp tính năng nhắn tin và kết bạn, cá nhân hóa trải nghiệm, bảo vệ an toàn hệ thống và hỗ trợ khi bạn liên hệ với chúng tôi.' },
    { title: '3. Chia sẻ và bảo vệ dữ liệu', content: 'Chúng tôi không bán thông tin cá nhân của bạn. Dữ liệu chỉ được chia sẻ khi cần để vận hành dịch vụ, tuân thủ yêu cầu pháp luật hoặc bảo vệ quyền và sự an toàn của người dùng. Chúng tôi áp dụng biện pháp kỹ thuật hợp lý để giảm rủi ro truy cập trái phép.' },
    { title: '4. Lựa chọn của bạn', content: 'Bạn có thể cập nhật thông tin hồ sơ, ảnh đại diện và quản lý kết nối bạn bè trong ứng dụng. Bạn cũng có thể yêu cầu hỗ trợ liên quan đến dữ liệu cá nhân qua kênh liên hệ của ChatWave.' },
    { title: '5. Lưu giữ dữ liệu', content: 'Chúng tôi chỉ lưu dữ liệu trong thời gian cần thiết để cung cấp dịch vụ, đáp ứng nghĩa vụ pháp lý và giải quyết tranh chấp. Chính sách này có thể được cập nhật khi dịch vụ phát triển.' },
];

const LegalPage = () => {
    const { pathname } = useLocation();
    const isPrivacy = pathname === '/privacy';
    const title = isPrivacy ? 'Chính sách bảo mật' : 'Điều khoản dịch vụ';
    const description = isPrivacy ? 'Cách ChatWave thu thập, sử dụng và bảo vệ thông tin của bạn.' : 'Các quy tắc giúp cộng đồng ChatWave kết nối an toàn và tôn trọng nhau.';
    const sections = isPrivacy ? PRIVACY_SECTIONS : TERMS_SECTIONS;
    const Icon = isPrivacy ? FaShieldAlt : FaCheckCircle;

    useEffect(() => {
        document.title = `${title} | ChatWave`;
        window.scrollTo(0, 0);
    }, [title]);

    return <div className="legal-page">
        <div className="legal-glow legal-glow-one" />
        <div className="legal-glow legal-glow-two" />
        <header className="legal-header">
            <Link className="legal-brand" to="/" aria-label="Về trang chủ ChatWave">ChatWave</Link>
            <Link className="legal-back" to="/"><FaArrowLeft aria-hidden="true" /> Về trang chủ</Link>
        </header>
        <section className="legal-content" aria-labelledby="legal-title">
            <div className="legal-hero">
                <span className="legal-icon"><Icon aria-hidden="true" /></span>
                <p className="legal-eyebrow">CHATWAVE · CẬP NHẬT 02/08/2026</p>
                <h1 id="legal-title">{title}</h1>
                <p>{description}</p>
            </div>
            <div className="legal-notice"><FaLock aria-hidden="true" /><span>Chúng tôi viết nội dung này bằng ngôn ngữ rõ ràng để bạn dễ hiểu quyền và trách nhiệm của mình.</span></div>
            <article className="legal-document">{sections.map((section) => <section key={section.title} className="legal-section"><h2>{section.title}</h2><p>{section.content}</p></section>)}</article>
            <aside className="legal-contact"><h2>Cần hỗ trợ?</h2><p>Nếu có câu hỏi về {title.toLowerCase()}, hãy liên hệ với đội ngũ ChatWave để được hỗ trợ.</p><a href="nguyendangtanphat11@gmail.com">nguyendangtanphat11@gmail.com</a></aside>
        </section>
        <Footer />
    </div>;
};

export default LegalPage;
